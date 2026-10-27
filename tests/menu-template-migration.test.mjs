import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { splitMenuTemplate } from '../scripts/migrate-menu-template.mjs';

const TARGET_BYTES = 350 * 1024;

function sourceTemplate(blockEntries, settings = { title: 'Menú', grid_columns: '2' }) {
  return {
    sections: {
      main: { type: 'main-page', disabled: true, settings: {} },
      menu: {
        type: 'menu-list',
        blocks: Object.fromEntries(blockEntries),
        block_order: blockEntries.map(([id]) => id),
        settings
      }
    },
    order: ['main', 'menu']
  };
}

function category(title, padding = '') {
  return { type: 'category', settings: { title, description: padding } };
}

function item(title, padding = '') {
  return { type: 'item', settings: { title, description: padding, base_price: 12000 } };
}

function flattenedBlocks(groups) {
  return groups.flatMap((group) => {
    const section = group.sections[Object.keys(group.sections)[0]];
    return section.block_order.map((id) => [id, section.blocks[id]]);
  });
}

test('preserves every block and setting in order', () => {
  const entries = [
    ['category-a', category('Desayunos')],
    ['item-a', item('Huevos')],
    ['item-b', item('Pancakes')],
    ['category-b', category('Bebidas')],
    ['item-c', item('Chocolate')]
  ];

  const result = splitMenuTemplate(sourceTemplate(entries), {
    groupCount: 4,
    targetBytes: TARGET_BYTES
  });

  assert.equal(result.groups.length, 4);
  assert.deepEqual(result.groups.map((group) => group.type), Array(4).fill('custom.menu_content'));
  assert.deepEqual(flattenedBlocks(result.groups), entries);
  assert.deepEqual(result.manifest.orderedBlockIds, entries.map(([id]) => id));
  assert.equal(result.manifest.sourceBlockCount, 5);
  assert.equal(result.manifest.outputBlockCount, 5);
  assert.ok(!Object.values(result.template.sections).some((section) => section.type === 'menu-list'));
  assert.deepEqual(result.template.order, ['main']);
});

test('default migration spreads an editor-sized menu across all four groups', () => {
  const entries = Array.from({ length: 16 }, (_, index) => [
    `category-${index}`,
    category(`Categoría ${index}`, 'x'.repeat(20 * 1024))
  ]);

  const result = splitMenuTemplate(sourceTemplate(entries));
  const populatedGroups = result.groups.filter((group) => {
    const section = group.sections[group.order[0]];
    return section.block_order.length > 0;
  });

  assert.equal(populatedGroups.length, 4, 'large editable menus need headroom in every section group');
  assert.ok(result.manifest.groupBytes.every((bytes) => bytes <= 100 * 1024));
  assert.deepEqual(result.manifest.orderedBlockIds, entries.map(([id]) => id));
});

test('keeps categories atomic including leading uncategorized items', () => {
  const entries = [
    ['loose-item', item('Sin categoría', 'x'.repeat(260))],
    ['category-a', category('Primera', 'a'.repeat(260))],
    ['item-a', item('Producto A', 'b'.repeat(260))],
    ['category-b', category('Segunda', 'c'.repeat(260))],
    ['item-b', item('Producto B', 'd'.repeat(260))]
  ];

  const result = splitMenuTemplate(sourceTemplate(entries), { groupCount: 4, targetBytes: 1150 });
  const populated = result.groups
    .map((group) => group.sections[Object.keys(group.sections)[0]].block_order)
    .filter((ids) => ids.length);

  assert.deepEqual(populated, [
    ['loose-item'],
    ['category-a', 'item-a'],
    ['category-b', 'item-b']
  ]);
});

test('rejects an oversized category before writing', () => {
  const template = sourceTemplate([
    ['category-a', category('Gigante')],
    ['item-a', item('Producto', 'x'.repeat(3000))]
  ]);

  assert.throws(
    () => splitMenuTemplate(template, { groupCount: 4, targetBytes: 1000 }),
    /category unit.*exceeds.*1000 bytes/i
  );
});

test('rejects capacity beyond four groups before writing', () => {
  const entries = Array.from({ length: 5 }, (_, index) => [
    `category-${index}`,
    category(`Categoría ${index}`, String(index).repeat(700))
  ]);

  assert.throws(
    () => splitMenuTemplate(sourceTemplate(entries), { groupCount: 4, targetBytes: 1200 }),
    /requires more than 4 groups/i
  );
});

test('rejects already migrated or missing menu sources', () => {
  const missing = { sections: { main: { type: 'main-page', settings: {} } }, order: ['main'] };
  const duplicated = sourceTemplate([['category-a', category('A')]]);
  duplicated.sections.menuCopy = structuredClone(duplicated.sections.menu);

  assert.throws(() => splitMenuTemplate(missing), /exactly one menu-list section/i);
  assert.throws(() => splitMenuTemplate(duplicated), /exactly one menu-list section/i);
});

test('CLI leaves source and destinations untouched when validation fails', () => {
  const root = mkdtempSync(join(tmpdir(), 'menu-migration-test-'));
  const themeRoot = join(root, 'theme');
  const templatesDir = join(themeRoot, 'templates');
  const backupDir = join(root, 'backup');
  mkdirSync(templatesDir, { recursive: true });
  mkdirSync(join(themeRoot, 'sections'), { recursive: true });
  const sourcePath = join(templatesDir, 'page.menu.json');
  const original = JSON.stringify({ sections: {}, order: [] }, null, 2);
  writeFileSync(sourcePath, original);

  const run = spawnSync(process.execPath, [
    new URL('../scripts/migrate-menu-template.mjs', import.meta.url).pathname,
    '--source', sourcePath,
    '--theme-root', themeRoot,
    '--backup-dir', backupDir
  ], { encoding: 'utf8' });

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /exactly one menu-list section/i);
  assert.equal(readFileSync(sourcePath, 'utf8'), original);
  assert.equal(existsSync(join(themeRoot, 'sections/menu-content-1.json')), false);
  assert.equal(existsSync(backupDir), false);
});

test('CLI refuses to overwrite an existing backup before mutating the theme', () => {
  const root = mkdtempSync(join(tmpdir(), 'menu-migration-backup-test-'));
  const themeRoot = join(root, 'theme');
  const templatesDir = join(themeRoot, 'templates');
  const backupDir = join(root, 'backup');
  mkdirSync(templatesDir, { recursive: true });
  mkdirSync(join(themeRoot, 'sections'), { recursive: true });
  mkdirSync(backupDir, { recursive: true });
  const sourcePath = join(templatesDir, 'page.menu.json');
  const original = `${JSON.stringify(sourceTemplate([['category-a', category('A')]]), null, 2)}\n`;
  const sentinel = 'existing backup';
  writeFileSync(sourcePath, original);
  writeFileSync(join(backupDir, 'page.menu.json'), sentinel);

  const run = spawnSync(process.execPath, [
    new URL('../scripts/migrate-menu-template.mjs', import.meta.url).pathname,
    '--source', sourcePath,
    '--theme-root', themeRoot,
    '--backup-dir', backupDir
  ], { encoding: 'utf8' });

  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /backup already exists/i);
  assert.equal(readFileSync(sourcePath, 'utf8'), original);
  assert.equal(readFileSync(join(backupDir, 'page.menu.json'), 'utf8'), sentinel);
  assert.equal(existsSync(join(themeRoot, 'sections/menu-content-1.json')), false);
});
