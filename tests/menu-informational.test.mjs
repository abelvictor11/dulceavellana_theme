import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sectionSource = readFileSync(new URL('../sections/menu-list.liquid', import.meta.url), 'utf8');
const template = JSON.parse(readFileSync(new URL('../templates/page.menu.json', import.meta.url), 'utf8'));
const schemaMatch = sectionSource.match(/{% schema %}([\s\S]*?){% endschema %}/);

assert.ok(schemaMatch, 'menu-list must expose a Shopify schema');

const schema = JSON.parse(schemaMatch[1]);
const settingIds = new Set(schema.settings.filter((setting) => setting.id).map((setting) => setting.id));
const blockTypes = new Map(schema.blocks.map((block) => [block.type, block]));

test('menu schema exposes category and manually configurable item blocks', () => {
  assert.deepEqual([...blockTypes.keys()], ['category', 'item']);

  const itemSettingIds = new Set(blockTypes.get('item').settings.map((setting) => setting.id));
  for (const id of [
    'title', 'badge', 'image', 'short_description', 'description', 'base_price',
    'option_1_name', 'option_1_price', 'option_4_name', 'option_4_price',
    'gallery_image_1', 'gallery_image_3'
  ]) {
    assert.ok(itemSettingIds.has(id), `missing item setting: ${id}`);
  }
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
  for (const value of ['data-additions-group="primary"', 'data-additions-group="secondary"', "querySelectorAll('[data-menu-additions]')"]) assert.ok(sectionSource.includes(value), `missing multiple group behavior: ${value}`);
});

test('desktop modal keeps gallery fixed and scrolls only its content column', () => {
  for (const value of ['@media (min-width: 701px)', 'Desktop split scroll', 'scrollbar-gutter: stable', 'overscroll-behavior: contain']) assert.ok(sectionSource.includes(value), `missing desktop modal scroll rule: ${value}`);
});

test('estimated total falls back to base price when no named presentation exists', () => {
  assert.ok(sectionSource.includes('function getBasePrice(dialog)'), 'missing base-price fallback');
  assert.doesNotMatch(sectionSource, /option_name != blank or option_price != blank/);
});

test('items expose and render seven dietary indicators', () => {
  const itemIds = new Set(blockTypes.get('item').settings.filter((s) => s.id).map((s) => s.id));
  for (const id of ['contains_peanuts', 'contains_tree_nuts', 'contains_gluten', 'contains_dairy', 'is_spicy', 'is_vegetarian', 'is_vegan']) assert.ok(itemIds.has(id), `missing dietary setting: ${id}`);
  for (const marker of ['data-menu-dietary-card', 'data-menu-dietary-modal']) assert.ok(sectionSource.includes(marker), `missing dietary markup: ${marker}`);
});

test('menu renders an accessible additions calculator contract', () => {
  for (const value of ['type="radio"', 'type="checkbox"', 'data-menu-presentation', 'data-menu-addition', 'data-menu-total', 'data-menu-selection-status', 'aria-live="polite"', 'function formatMoney', 'function updateEstimate', 'function resetConfigurator']) assert.ok(sectionSource.includes(value), `missing additions behavior: ${value}`);
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
    assert.ok(sectionSource.includes(required), `missing markup or behavior: ${required}`);
  }
});

test('page template seeds ordered informational blocks', () => {
  const menu = template.sections.menu;
  assert.equal(menu.type, 'menu-list');
  const orderedTypes = menu.block_order.map((id) => menu.blocks[id].type);
  assert.deepEqual(orderedTypes, ['category', 'item', 'item', 'category', 'item']);
  assert.equal(menu.settings.grid_columns, '2');
  assert.equal(menu.settings.detail_button_label, 'Ver detalles');
});
