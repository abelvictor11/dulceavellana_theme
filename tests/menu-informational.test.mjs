import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import test from 'node:test';

const sectionSource = readFileSync(new URL('../sections/menu-list.liquid', import.meta.url), 'utf8');
const menuScript = readFileSync(new URL('../assets/menu-list.js', import.meta.url), 'utf8');
const menuRuntimeSource = `${sectionSource}\n${menuScript}`;
const themeLayout = readFileSync(new URL('../layout/theme.liquid', import.meta.url), 'utf8');
const dietarySnippet = readFileSync(new URL('../snippets/menu-dietary-indicators.liquid', import.meta.url), 'utf8');
const template = JSON.parse(readFileSync(new URL('../templates/page.menu.json', import.meta.url), 'utf8'));
const groupUrls = [1, 2, 3, 4].map((index) => new URL(`../sections/menu-content-${index}.json`, import.meta.url));
const menuGroups = groupUrls.map((url) => JSON.parse(readFileSync(url, 'utf8')));
const schemaMatch = sectionSource.match(/{% schema %}([\s\S]*?){% endschema %}/);

assert.ok(schemaMatch, 'menu-list must expose a Shopify schema');

const schema = JSON.parse(schemaMatch[1]);
const settingIds = new Set(schema.settings.filter((setting) => setting.id).map((setting) => setting.id));
const blockTypes = new Map(schema.blocks.map((block) => [block.type, block]));

test('menu schema exposes category, configurable item and simple item blocks', () => {
  assert.deepEqual([...blockTypes.keys()], ['category', 'item', 'item_simple']);

  const itemSettingIds = new Set(blockTypes.get('item').settings.map((setting) => setting.id));
  for (const id of [
    'title', 'badge', 'image', 'show_image', 'short_description', 'description', 'base_price',
    'option_1_name', 'option_1_price', 'option_4_name', 'option_4_price',
    'gallery_image_1', 'gallery_image_3'
  ]) {
    assert.ok(itemSettingIds.has(id), `missing item setting: ${id}`);
  }
  assert.equal(blockTypes.get('item').settings.find((s) => s.id === 'show_image').default, true);
});

test('simple item exposes only text and price, no image or variation settings', () => {
  const simple = blockTypes.get('item_simple');
  const simpleIds = new Set(simple.settings.filter((s) => s.id).map((s) => s.id));
  assert.deepEqual([...simpleIds], ['title', 'badge', 'short_description', 'base_price']);
  for (const forbidden of ['image', 'option_1_name', 'additions_behavior', 'gallery_image_1']) {
    assert.ok(!simpleIds.has(forbidden), `simple item must not expose: ${forbidden}`);
  }
  assert.ok(sectionSource.includes("block.type == 'item_simple'"), 'missing item_simple render branch');
  assert.ok(sectionSource.includes('show_item_media'), 'missing optional image flag');
  assert.ok(sectionSource.includes('MenuDialog__Layout--noMedia'), 'missing no-media modal layout');
});

test('simple items render as compact full-width list rows', () => {
  assert.match(sectionSource, /\.MenuItem--simple\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;[^}]*\}/s);
  assert.match(sectionSource, /\.MenuItem--simple \.MenuItem__Button--static\s*\{[^}]*height:\s*auto;[^}]*min-height:\s*0;[^}]*background:\s*transparent;[^}]*\}/s);
  assert.match(sectionSource, /\.MenuItem--simple \.MenuItem__Content\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto;[^}]*\}/s);
  assert.match(sectionSource, /\.MenuItem--simple \.MenuItem__Footer\s*\{[^}]*margin-top:\s*0;[^}]*padding-top:\s*0;[^}]*\}/s);
});

test('additions groups support up to twelve options in categories and items', () => {
  const category = new Map(blockTypes.get('category').settings.filter((s) => s.id).map((s) => [s.id, s]));
  const item = new Map(blockTypes.get('item').settings.filter((s) => s.id).map((s) => [s.id, s]));
  for (const id of ['addition_12_name', 'addition_12_price', 'secondary_addition_12_name', 'secondary_addition_12_price']) {
    assert.ok(category.has(id), `missing category addition: ${id}`);
  }
  for (const id of ['custom_addition_12_name', 'custom_addition_12_price', 'custom_secondary_addition_12_name', 'custom_secondary_addition_12_price']) {
    assert.ok(item.has(id), `missing item addition: ${id}`);
  }
  for (const id of ['additions_max', 'secondary_additions_max']) assert.equal(category.get(id).max, 12, `${id} must allow 12`);
  for (const id of ['custom_additions_max', 'custom_secondary_additions_max']) assert.equal(item.get(id).max, 12, `${id} must allow 12`);
  assert.ok(sectionSource.includes('(1..12)'), 'render loops must iterate up to 12 additions');
});

test('category and item expose a third additions group that renders independently', () => {
  const category = new Map(blockTypes.get('category').settings.filter((s) => s.id).map((s) => [s.id, s]));
  const item = new Map(blockTypes.get('item').settings.filter((s) => s.id).map((s) => [s.id, s]));
  for (const id of ['tertiary_additions_title', 'tertiary_additions_min', 'tertiary_additions_max', 'tertiary_addition_1_name', 'tertiary_addition_12_name', 'tertiary_addition_12_price']) {
    assert.ok(category.has(id), `missing tertiary category setting: ${id}`);
  }
  for (const id of ['tertiary_additions_behavior', 'custom_tertiary_additions_title', 'custom_tertiary_additions_max', 'custom_tertiary_addition_1_name', 'custom_tertiary_addition_12_name', 'custom_tertiary_addition_12_price']) {
    assert.ok(item.has(id), `missing tertiary item setting: ${id}`);
  }
  assert.equal(category.get('tertiary_additions_max').max, 12, 'tertiary max must allow 12');
  assert.ok(sectionSource.includes('data-additions-group="tertiary"'), 'missing tertiary render group');
});

test('categories and items expose inherited additions with numeric prices', () => {
  const category = new Map(blockTypes.get('category').settings.filter((s) => s.id).map((s) => [s.id, s]));
  const item = new Map(blockTypes.get('item').settings.filter((s) => s.id).map((s) => [s.id, s]));
  for (const id of ['additions_title', 'additions_min', 'additions_max', 'addition_1_name', 'addition_1_price', 'addition_8_name', 'addition_8_price']) assert.ok(category.has(id), `missing category setting: ${id}`);
  for (const id of ['additions_behavior', 'custom_additions_title', 'custom_additions_min', 'custom_additions_max', 'custom_addition_1_name', 'custom_addition_1_price', 'custom_addition_8_name', 'custom_addition_8_price']) assert.ok(item.has(id), `missing item setting: ${id}`);
  assert.equal(item.get('base_price').type, 'number');
  assert.equal(item.get('option_1_price').type, 'number');
});

test('schema exposes an independent secondary additions group', () => {
  const category = new Map(blockTypes.get('category').settings.filter((s) => s.id).map((s) => [s.id, s]));
  const item = new Map(blockTypes.get('item').settings.filter((s) => s.id).map((s) => [s.id, s]));
  for (const id of ['secondary_additions_title', 'secondary_additions_min', 'secondary_additions_max', 'secondary_addition_1_name', 'secondary_addition_8_price']) assert.ok(category.has(id), `missing secondary category setting: ${id}`);
  for (const id of ['secondary_additions_behavior', 'custom_secondary_additions_title', 'custom_secondary_additions_min', 'custom_secondary_additions_max', 'custom_secondary_addition_1_name', 'custom_secondary_addition_8_price']) assert.ok(item.has(id), `missing secondary item setting: ${id}`);
  assert.equal(category.get('secondary_additions_max').default, 3);
  assert.equal(item.get('custom_secondary_additions_max').default, 3);
});

test('markup and calculator support primary and secondary groups independently', () => {
  for (const value of ['data-additions-group="primary"', 'data-additions-group="secondary"', "querySelectorAll('[data-menu-additions]')"]) assert.ok(menuRuntimeSource.includes(value), `missing multiple group behavior: ${value}`);
});

test('desktop modal keeps gallery fixed and scrolls only its content column', () => {
  for (const value of ['@media (min-width: 701px)', 'Desktop split scroll', 'scrollbar-gutter: stable', 'overscroll-behavior: contain']) assert.ok(sectionSource.includes(value), `missing desktop modal scroll rule: ${value}`);
});

test('estimated total falls back to base price when no named presentation exists', () => {
  assert.ok(menuRuntimeSource.includes('function getBasePrice(dialog)'), 'missing base-price fallback');
  assert.doesNotMatch(sectionSource, /option_name != blank or option_price != blank/);
});

test('items expose and render seven dietary indicators', () => {
  const itemIds = new Set(blockTypes.get('item').settings.filter((s) => s.id).map((s) => s.id));
  for (const id of ['contains_peanuts', 'contains_tree_nuts', 'contains_gluten', 'contains_dairy', 'is_spicy', 'is_vegetarian', 'is_vegan']) assert.ok(itemIds.has(id), `missing dietary setting: ${id}`);
  for (const marker of ['data-menu-dietary-card', 'data-menu-dietary-modal']) assert.ok(sectionSource.includes(marker), `missing dietary markup: ${marker}`);
});

test('dietary indicators use the supplied optimized SVG artwork', () => {
  for (const icon of ['peanut_icon', 'tree_nut_icon', 'gluten_icon', 'dairy_icon', 'spicy_icon', 'vegetarian_icon']) {
    assert.ok(dietarySnippet.includes(`capture ${icon}`), `missing supplied icon: ${icon}`);
  }
  for (const binding of [
    ['contains_peanuts', 'peanut_icon'],
    ['contains_tree_nuts', 'tree_nut_icon'],
    ['contains_gluten', 'gluten_icon'],
    ['contains_dairy', 'dairy_icon'],
    ['is_spicy', 'spicy_icon'],
    ['is_vegetarian', 'vegetarian_icon'],
    ['is_vegan', 'vegetarian_icon']
  ]) {
    assert.match(dietarySnippet, new RegExp(`item\\.${binding[0]}[\\s\\S]*?\\{\\{ ${binding[1]} \\}\\}`));
  }
  assert.doesNotMatch(dietarySnippet, /warning_icon|leaf_icon|flame_icon|<metadata|<\?xml|AdobeIllustrator/);
  assert.equal((dietarySnippet.match(/aria-hidden="true"/g) || []).length, 6);
  assert.equal((dietarySnippet.match(/fill="currentColor"/g) || []).length, 6);
});

test('menu renders an accessible additions calculator contract', () => {
  for (const value of ['type="radio"', 'type="checkbox"', 'data-menu-presentation', 'data-menu-addition', 'data-menu-total', 'data-menu-selection-status', 'aria-live="polite"', 'function formatMoney', 'function updateEstimate', 'function resetConfigurator']) assert.ok(menuRuntimeSource.includes(value), `missing additions behavior: ${value}`);
});

test('menu section exposes the agreed presentation controls', () => {
  for (const id of [
    'show_filter', 'sticky_filter', 'grid_columns', 'image_size', 'card_radius',
    'modal_radius', 'detail_button_label', 'from_label', 'general_category_label'
  ]) {
    assert.ok(settingIds.has(id), `missing section setting: ${id}`);
  }
});

test('menu no longer depends on Shopify catalog or cart objects', () => {
  for (const forbidden of [
    /collections\[/, /collection\.products/, /product\./, /variant/i,
    /cartAddUrl/, /data-menu-add(?!ition)/, /\/cart\//
  ]) {
    assert.doesNotMatch(sectionSource, forbidden);
  }
});

test('menu markup contains accessible dialog and gallery contracts', () => {
  for (const required of [
    'data-menu-open', 'data-menu-dialog', 'data-menu-close', 'data-menu-thumbnail',
    'role="dialog"', 'aria-modal="true"', 'shopify:section:load',
    'shopify:section:unload', 'MenuModalOpen'
  ]) {
    assert.ok(menuRuntimeSource.includes(required), `missing markup or behavior: ${required}`);
  }
});

test('distributed menu segments initialize as one editor-safe interface', () => {
  const segmentRole = schema.settings.find((setting) => setting.id === 'segment_role');
  assert.equal(segmentRole.type, 'select');
  assert.deepEqual(segmentRole.options.map((option) => option.value), ['primary', 'continuation']);
  assert.equal(segmentRole.default, 'primary');
  assert.ok(sectionSource.includes('data-menu-segment="{{ segment_role }}"'));
  assert.ok(sectionSource.includes("section.settings.segment_role == 'continuation'"));
  assert.ok(sectionSource.includes('data-menu-category-label='));
  assert.ok(sectionSource.includes("'menu-list.js' | asset_url"));
  assert.match(menuScript, /if \(window\.DulceAvellanaMenu\) return;/);
  assert.match(menuScript, /window\.DulceAvellanaMenu\s*=\s*\{\s*init:/);
  for (const eventName of [
    'DOMContentLoaded', 'shopify:section:load', 'shopify:section:unload',
    'shopify:section:reorder', 'shopify:block:select'
  ]) {
    assert.ok(menuScript.includes(eventName), `missing editor-safe event: ${eventName}`);
  }
  assert.ok(menuScript.includes("dataset.menuInitialized === 'true'"));
  assert.ok(menuScript.includes('data-menu-filter-generated'));
});

test('page menu stores content in four bounded custom section groups', () => {
  assert.ok(!Object.values(template.sections).some((section) => section.type === 'menu-list'));
  assert.ok(statSync(new URL('../templates/page.menu.json', import.meta.url)).size < 512 * 1024);
  assert.deepEqual(
    readdirSync(new URL('../sections/', import.meta.url)).filter((name) => /^menu-content-\d+\.json$/.test(name)).sort(),
    ['menu-content-1.json', 'menu-content-2.json', 'menu-content-3.json', 'menu-content-4.json']
  );

  const segments = menuGroups.map((group, index) => {
    assert.equal(group.type, 'custom.menu_content');
    assert.equal(group.name, `Menú · Parte ${index + 1}`);
    assert.equal(group.order.length, 1);
    assert.ok(statSync(groupUrls[index]).size < 512 * 1024);
    const section = group.sections[group.order[0]];
    assert.equal(section.type, 'menu-list');
    return section;
  });

  assert.deepEqual(segments.map((section) => section.settings.segment_role), [
    'primary', 'continuation', 'continuation', 'continuation'
  ]);
  assert.deepEqual(segments.flatMap((section) => section.block_order), [
    'category-1', 'item-1', 'item-2', 'category-2', 'item-3'
  ]);
  assert.deepEqual(
    segments.flatMap((section) => section.block_order.map((id) => section.blocks[id].type)),
    ['category', 'item', 'item', 'category', 'item']
  );
  assert.equal(segments[0].blocks['item-1'].settings.title, 'Nuevo ítem');
  assert.equal(segments[0].blocks['item-1'].settings.option_4_price, 0);
  assert.equal(segments[0].settings.grid_columns, '2');
  assert.equal(segments[0].settings.detail_button_label, 'Ver detalles');
});

test('layout renders distributed groups only for the menu page', () => {
  assert.equal((themeLayout.match(/\{\{\s*content_for_layout\s*\}\}/g) || []).length, 1);
  const menuBranch = themeLayout.match(/{%-?\s*if template\.name == 'page' and template\.suffix == 'menu'\s*-?%}([\s\S]*?){%-?\s*endif\s*-?%}/);
  assert.ok(menuBranch, 'missing page.menu-only layout branch');
  assert.ok(menuBranch[1].includes('data-menu-page'));
  for (const index of [1, 2, 3, 4]) {
    const tag = `{% sections 'menu-content-${index}' %}`;
    assert.equal((themeLayout.match(new RegExp(`\\{% sections 'menu-content-${index}' %\\}`, 'g')) || []).length, 1);
    assert.ok(menuBranch[1].includes(tag), `missing conditional group: ${tag}`);
  }
  const outsideMenuBranch = themeLayout.replace(menuBranch[0], '');
  assert.doesNotMatch(outsideMenuBranch, /menu-content-[1-4]/);
});
