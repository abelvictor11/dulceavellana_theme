#!/usr/bin/env node

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_GROUP_COUNT = 4;
const DEFAULT_TARGET_BYTES = 350 * 1024;
const SHOPIFY_JSON_LIMIT = 512 * 1024;

function byteSize(value) {
  return Buffer.byteLength(JSON.stringify(value));
}

function findMenuSection(template) {
  const matches = Object.entries(template?.sections || {}).filter(([, section]) => section?.type === 'menu-list');
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one menu-list section, found ${matches.length}.`);
  }
  return matches[0];
}

function categoryUnits(section) {
  const units = [];
  let current = [];
  for (const id of section.block_order || []) {
    const block = section.blocks?.[id];
    if (!block) throw new Error(`Block order references missing block: ${id}.`);
    if (block.type === 'category' && current.length) {
      units.push(current);
      current = [];
    }
    current.push([id, structuredClone(block)]);
  }
  if (current.length) units.push(current);
  return units;
}

function makeGroup(index, sourceSection) {
  const sectionId = `menu${index + 1}`;
  return {
    type: 'custom.menu_content',
    name: `Menú · Parte ${index + 1}`,
    sections: {
      [sectionId]: {
        type: 'menu-list',
        blocks: {},
        block_order: [],
        settings: {
          ...(structuredClone(sourceSection.settings || {})),
          segment_role: index === 0 ? 'primary' : 'continuation'
        }
      }
    },
    order: [sectionId]
  };
}

function appendUnit(group, unit) {
  const section = group.sections[group.order[0]];
  for (const [id, block] of unit) {
    section.blocks[id] = structuredClone(block);
    section.block_order.push(id);
  }
}

export function splitMenuTemplate(template, options = {}) {
  const groupCount = options.groupCount ?? DEFAULT_GROUP_COUNT;
  const targetBytes = options.targetBytes ?? DEFAULT_TARGET_BYTES;
  if (!Number.isInteger(groupCount) || groupCount < 1) throw new Error('groupCount must be a positive integer.');
  if (!Number.isInteger(targetBytes) || targetBytes < 1 || targetBytes >= SHOPIFY_JSON_LIMIT) {
    throw new Error(`targetBytes must be between 1 and ${SHOPIFY_JSON_LIMIT - 1}.`);
  }

  const [sourceId, sourceSection] = findMenuSection(template);
  const groups = Array.from({ length: groupCount }, (_, index) => makeGroup(index, sourceSection));
  let groupIndex = 0;

  for (const unit of categoryUnits(sourceSection)) {
    const candidate = structuredClone(groups[groupIndex]);
    appendUnit(candidate, unit);
    if (byteSize(candidate) > targetBytes) {
      const currentSection = groups[groupIndex].sections[groups[groupIndex].order[0]];
      if (currentSection.block_order.length === 0) {
        throw new Error(`Category unit beginning with ${unit[0][0]} exceeds ${targetBytes} bytes.`);
      }
      groupIndex += 1;
      if (groupIndex >= groupCount) throw new Error(`Menu requires more than ${groupCount} groups.`);
      const emptyCandidate = structuredClone(groups[groupIndex]);
      appendUnit(emptyCandidate, unit);
      if (byteSize(emptyCandidate) > targetBytes) {
        throw new Error(`Category unit beginning with ${unit[0][0]} exceeds ${targetBytes} bytes.`);
      }
      groups[groupIndex] = emptyCandidate;
    } else {
      groups[groupIndex] = candidate;
    }
  }

  const outputTemplate = structuredClone(template);
  delete outputTemplate.sections[sourceId];
  outputTemplate.order = (outputTemplate.order || []).filter((id) => id !== sourceId);

  const sourceBlockIds = sourceSection.block_order || [];
  const outputBlockIds = groups.flatMap((group) => {
    const section = group.sections[group.order[0]];
    return section.block_order;
  });
  const byteSizes = groups.map(byteSize);
  if (byteSize(outputTemplate) >= SHOPIFY_JSON_LIMIT || byteSizes.some((size) => size >= SHOPIFY_JSON_LIMIT)) {
    throw new Error(`Generated JSON reaches Shopify's ${SHOPIFY_JSON_LIMIT}-byte limit.`);
  }

  return {
    template: outputTemplate,
    groups,
    manifest: {
      sourceBlockCount: sourceBlockIds.length,
      outputBlockCount: outputBlockIds.length,
      orderedBlockIds: outputBlockIds,
      templateBytes: byteSize(outputTemplate),
      groupBytes: byteSizes
    }
  };
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag?.startsWith('--') || !value) throw new Error('Expected --source, --theme-root and --backup-dir values.');
    values[flag.slice(2)] = value;
  }
  for (const required of ['source', 'theme-root', 'backup-dir']) {
    if (!values[required]) throw new Error(`Missing required flag: --${required}.`);
  }
  return values;
}

function runCli(argv) {
  const args = parseArgs(argv);
  const sourcePath = resolve(args.source);
  const themeRoot = resolve(args['theme-root']);
  const backupDir = resolve(args['backup-dir']);
  const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
  const result = splitMenuTemplate(source);
  const serializedTemplate = `${JSON.stringify(result.template, null, 2)}\n`;
  const serializedGroups = result.groups.map((group) => `${JSON.stringify(group, null, 2)}\n`);

  mkdirSync(backupDir, { recursive: true });
  copyFileSync(sourcePath, join(backupDir, basename(sourcePath)));
  mkdirSync(join(themeRoot, 'sections'), { recursive: true });
  writeFileSync(sourcePath, serializedTemplate);
  serializedGroups.forEach((content, index) => {
    writeFileSync(join(themeRoot, 'sections', `menu-content-${index + 1}.json`), content);
  });
  process.stdout.write(`${JSON.stringify(result.manifest, null, 2)}\n`);
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
