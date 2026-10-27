(function () {
  'use strict';

  if (window.DulceAvellanaMenu) return;

  var activeTrigger = null;

  function focusable(dialog) {
    return Array.prototype.slice.call(dialog.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value) || 0);
  }

  function normalizeLimits(group) {
    var count = group.querySelectorAll('[data-menu-addition]').length;
    var max = Math.min(Math.max(Number(group.dataset.max) || 1, 1), count || 1);
    var min = Math.min(Math.max(Number(group.dataset.min) || 0, 0), max);
    return { min: min, max: max };
  }

  function getBasePrice(dialog) {
    var selected = dialog.querySelector('[data-menu-presentation]:checked');
    var totalNode = dialog.querySelector('[data-menu-total]');
    return selected ? Number(selected.dataset.price) || 0 : Number(totalNode && totalNode.dataset.basePrice) || 0;
  }

  function updateEstimate(dialog) {
    if (!dialog) return;
    dialog.querySelectorAll('[data-format-price]').forEach(function (element) {
      var value = Number(element.dataset.formatPrice) || 0;
      element.textContent = element.hasAttribute('data-addition-price') ? (value ? '+ ' + formatMoney(value) : 'Sin costo') : formatMoney(value);
    });
    var totalNode = dialog.querySelector('[data-menu-total]');
    var total = getBasePrice(dialog);
    dialog.querySelectorAll('[data-menu-additions]').forEach(function (group) {
      var limits = normalizeLimits(group);
      var additions = Array.prototype.slice.call(group.querySelectorAll('[data-menu-addition]'));
      var selected = additions.filter(function (input) { return input.checked; });
      selected.forEach(function (input) { total += Number(input.dataset.price) || 0; });
      additions.forEach(function (input) { input.disabled = !input.checked && selected.length >= limits.max; });
      var status = group.querySelector('[data-menu-selection-status]');
      if (status) status.textContent = selected.length < limits.min ? 'Selecciona al menos ' + limits.min : selected.length + ' de ' + limits.max + ' seleccionadas';
    });
    if (totalNode) totalNode.textContent = 'Total estimado: ' + formatMoney(total);
  }

  function resetConfigurator(dialog) {
    dialog.querySelectorAll('[data-menu-presentation]').forEach(function (radio, index) { radio.checked = index === 0; });
    dialog.querySelectorAll('[data-menu-addition]').forEach(function (input) { input.checked = false; input.disabled = false; });
    updateEstimate(dialog);
  }

  function openDialog(dialog, trigger) {
    if (!dialog) return;
    activeTrigger = trigger;
    dialog.classList.add('is-open');
    dialog.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('MenuModalOpen');
    updateEstimate(dialog);
    var close = dialog.querySelector('[data-menu-close]');
    if (close) close.focus();
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    dialog.classList.remove('is-open');
    dialog.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('MenuModalOpen');
    resetConfigurator(dialog);
    if (activeTrigger && document.documentElement.contains(activeTrigger)) activeTrigger.focus();
    activeTrigger = null;
  }

  function selectImage(button) {
    var dialog = button.closest('[data-menu-dialog]');
    var image = dialog && dialog.querySelector('[data-menu-main-image]');
    if (!image) return;
    image.src = button.dataset.imageSrc;
    image.srcset = button.dataset.imageSrcset || '';
    image.alt = button.dataset.imageAlt || '';
    dialog.querySelectorAll('[data-menu-thumbnail]').forEach(function (thumbnail) {
      thumbnail.setAttribute('aria-pressed', thumbnail === button ? 'true' : 'false');
    });
  }

  function pageScope(node) {
    return node && node.closest ? node.closest('[data-menu-page]') || document : document;
  }

  function rebuildFilter(scope) {
    var page = pageScope(scope);
    var track = page.querySelector('[data-menu-segment="primary"] [data-menu-filter-track]');
    if (!track) return;
    track.querySelectorAll('[data-menu-filter-generated]').forEach(function (button) { button.remove(); });
    page.querySelectorAll('[data-menu-category][data-menu-category-label]').forEach(function (category, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'MenuFilter__Item' + (index === 0 ? ' is-active' : '');
      button.dataset.filterTarget = category.id;
      button.setAttribute('data-menu-filter-generated', '');
      button.textContent = category.dataset.menuCategoryLabel;
      track.appendChild(button);
    });
  }

  function scrollToCategory(button) {
    var target = document.getElementById(button.dataset.filterTarget);
    if (!target) return;
    var page = pageScope(button);
    page.querySelectorAll('.MenuFilter__Item').forEach(function (item) { item.classList.remove('is-active'); });
    button.classList.add('is-active');
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function initSegment(root) {
    if (!root || root.dataset.menuInitialized === 'true') return;
    root.dataset.menuInitialized = 'true';

    root.addEventListener('click', function (event) {
      var opener = event.target.closest('[data-menu-open]');
      var closer = event.target.closest('[data-menu-close]');
      var thumbnail = event.target.closest('[data-menu-thumbnail]');
      var filter = event.target.closest('[data-filter-target]');
      var backdrop = event.target.matches('[data-menu-dialog]') ? event.target : null;
      if (opener) openDialog(document.getElementById(opener.dataset.menuOpen), opener);
      else if (closer) closeDialog(closer.closest('[data-menu-dialog]'));
      else if (thumbnail) selectImage(thumbnail);
      else if (filter) scrollToCategory(filter);
      else if (backdrop) closeDialog(backdrop);
    });

    root.addEventListener('keydown', function (event) {
      var dialog = event.target.closest('[data-menu-dialog].is-open');
      if (!dialog) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog(dialog);
        return;
      }
      if (event.key !== 'Tab') return;
      var items = focusable(dialog);
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    root.addEventListener('change', function (event) {
      if (event.target.matches('[data-menu-presentation], [data-menu-addition]')) updateEstimate(event.target.closest('[data-menu-dialog]'));
    });
  }

  function init(scope) {
    var searchRoot = scope && scope.querySelectorAll ? scope : document;
    if (searchRoot.matches && searchRoot.matches('[data-section-type="menu-list"]')) initSegment(searchRoot);
    searchRoot.querySelectorAll('[data-section-type="menu-list"]').forEach(initSegment);
    rebuildFilter(scope || document);
  }

  window.DulceAvellanaMenu = { init: init };

  document.addEventListener('DOMContentLoaded', function () { init(document); });
  document.addEventListener('shopify:section:load', function (event) { init(event.target); });
  document.addEventListener('shopify:section:unload', function () {
    document.documentElement.classList.remove('MenuModalOpen');
    rebuildFilter(document);
  });
  document.addEventListener('shopify:section:reorder', function () { init(document); });
  document.addEventListener('shopify:block:select', function (event) {
    init(document);
    if (event.target && event.target.scrollIntoView) event.target.scrollIntoView({ block: 'nearest' });
  });
}());
