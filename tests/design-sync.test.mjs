import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const settings = readJson('config/settings_data.json').current;
const indexTemplate = readJson('templates/index.json');
const productTemplate = readJson('templates/product.json');

const addedTemplates = [
  'templates/collection.nueva-plantilla-de-colecc.json',
  'templates/collection.temporada-inactiva.json',
  'templates/page.bodas-y-eventos-nueva.json',
  'templates/page.fechas-especiales.json',
  'templates/page.mesas-de-experiencia.json',
  'templates/page.regalos-corporativos.json',
  'templates/page.tortas-y-postres-para-15.json',
  'templates/page.tortas-y-postres-para-bodas.json'
];

test('store settings use the approved visual identity and navigation', () => {
  assert.equal(settings.base_text_font_size, 15);
  assert.equal(settings.heading_font, 'quicksand_n6');
  assert.equal(settings.heading_size, 'large');
  assert.equal(settings.text_font, 'quicksand_n4');
  assert.equal(settings.sections.header.settings.enable_transparent_header, true);
  assert.equal(settings.sections.header.settings.logo_max_width, 50);
  assert.equal(settings.sections.header.settings.mobile_logo_max_width, 50);
  assert.equal(settings.sections.header.settings.navigation_menu, 'nav-menu-d-a-del-padre');
  assert.equal(settings.sections['sidebar-menu'].settings.primary_menu, 'nav-menu-d-a-del-padre');
});

test('home and product templates use the approved compositions', () => {
  assert.equal(indexTemplate.order[0], 'image_with_text_overlay_9AFa8M');
  assert.equal(indexTemplate.sections.image_with_text_overlay_9AFa8M.type, 'image-with-text-overlay');
  assert.equal(indexTemplate.sections.featured_product_E7w8rh.type, 'featured-product');
  assert.equal(productTemplate.sections.product_recommendations_LLknWE.type, 'product-recommendations');
  assert.deepEqual(productTemplate.order, ['main', 'product_recommendations_LLknWE']);
});

test('approved additional templates exist and reference available section types', () => {
  for (const templatePath of addedTemplates) {
    assert.ok(existsSync(new URL(`../${templatePath}`, import.meta.url)), `missing ${templatePath}`);
    const template = readJson(templatePath);
    for (const section of Object.values(template.sections)) {
      if (section.type === 'apps') continue;
      assert.ok(existsSync(new URL(`../sections/${section.type}.liquid`, import.meta.url)), `missing section ${section.type} used by ${templatePath}`);
    }
  }
});

test('preloader is installed while footer and heading semantics stay approved', () => {
  const layout = readFileSync(new URL('../layout/theme.liquid', import.meta.url), 'utf8');
  const footer = readFileSync(new URL('../sections/footer.liquid', import.meta.url), 'utf8');
  const header = readFileSync(new URL('../sections/header.liquid', import.meta.url), 'utf8');
  const overlay = readFileSync(new URL('../sections/image-with-text-overlay.liquid', import.meta.url), 'utf8');
  const productMeta = readFileSync(new URL('../snippets/product-meta.liquid', import.meta.url), 'utf8');

  assert.ok(existsSync(new URL('../assets/tiny-img-link-preloader.js', import.meta.url)));
  assert.ok(layout.includes(`{{ 'tiny-img-link-preloader.js' | asset_url }}`));
  assert.ok(!footer.includes('Powered By'));
  assert.ok(header.includes('<h1 class="Header__Logo">'));
  assert.ok(overlay.includes('<h2 class="SectionHeader__Heading Heading u-h1">'));
  assert.ok(productMeta.includes('<h1 class="ProductMeta__Title Heading u-h2">'));
});
