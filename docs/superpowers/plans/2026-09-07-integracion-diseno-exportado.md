# Integración selectiva del diseño exportado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incorporar en `staging` el diseño y contenido de `/Users/usuario/Downloads/dulceavellana` sin alterar el menú informativo ni degradar la semántica HTML existente.

**Architecture:** La migración usa una lista cerrada de archivos. Los JSON de configuración y plantillas se importan literalmente; los cambios de layout y footer se aplican de forma quirúrgica; una prueba estructural protege los resultados y las exclusiones SEO.

**Tech Stack:** Shopify Liquid, plantillas JSON, JavaScript, Node.js `node:test`, `jq`, Shopify Theme Check y Git.

**Spec:** `docs/superpowers/specs/2026-09-07-integracion-diseno-exportado-design.md`

## Global Constraints

- La exportación es autoridad para configuración visual, contenido editorial y composición de plantillas.
- El repositorio es autoridad para código funcional, estructura semántica y desarrollos personalizados.
- Solo se pueden modificar los archivos enumerados en la especificación, además de esta prueba y el plan.
- No se eliminan archivos por estar ausentes en la exportación.
- `sections/menu-list.liquid`, `snippets/menu-dietary-indicators.liquid`, `templates/page.menu.json` y `tests/menu-informational.test.mjs` deben conservar exactamente sus hashes SHA-256 registrados.
- La entrega se realiza en la rama `staging` mediante Pull Request; no se publica el tema en Shopify.

---

### Task 1: Importar configuración visual y plantillas con un contrato estructural

**Files:**
- Create: `tests/design-sync.test.mjs`
- Modify: `config/settings_data.json`
- Modify: `templates/collection.json`
- Modify: `templates/index.json`
- Modify: `templates/page.contact.json`
- Modify: `templates/password.json`
- Modify: `templates/product.json`
- Create: `templates/collection.nueva-plantilla-de-colecc.json`
- Create: `templates/collection.temporada-inactiva.json`
- Create: `templates/page.bodas-y-eventos-nueva.json`
- Create: `templates/page.fechas-especiales.json`
- Create: `templates/page.mesas-de-experiencia.json`
- Create: `templates/page.regalos-corporativos.json`
- Create: `templates/page.tortas-y-postres-para-15.json`
- Create: `templates/page.tortas-y-postres-para-bodas.json`

**Interfaces:**
- Consumes: JSON aprobado de `/Users/usuario/Downloads/dulceavellana/config/` y `/Users/usuario/Downloads/dulceavellana/templates/`.
- Produces: configuración y plantillas locales equivalentes a la exportación, validadas por `tests/design-sync.test.mjs`.

- [ ] **Step 1: Crear la prueba estructural de diseño y plantillas**

Crear `tests/design-sync.test.mjs` con este contenido:

```js
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
  assert.equal(settings.sections.sidebar-menu.settings.primary_menu, 'nav-menu-d-a-del-padre');
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
```

- [ ] **Step 2: Ejecutar la prueba y confirmar el fallo correcto**

Run: `node --test tests/design-sync.test.mjs`

Expected: FAIL porque `base_text_font_size` aún es `14` y las ocho plantillas nuevas no existen.

- [ ] **Step 3: Importar literalmente los seis JSON modificados y las ocho plantillas nuevas**

Usar `apply_patch` para que cada destino contenga exactamente el JSON de su ruta homóloga bajo `/Users/usuario/Downloads/dulceavellana`. La correspondencia es uno a uno y conserva el mismo path relativo para los 14 archivos listados en **Files**.

No modificar ni eliminar ninguna otra plantilla.

- [ ] **Step 4: Validar JSON y ejecutar la prueba verde**

Run:

```bash
for file in config/settings_data.json templates/*.json; do jq empty "$file" || exit 1; done
node --test tests/design-sync.test.mjs
```

Expected: todos los JSON válidos y 3 pruebas aprobadas.

- [ ] **Step 5: Registrar la migración de configuración y contenido**

```bash
git add config/settings_data.json templates tests/design-sync.test.mjs
git commit -m "feat: sincronizar diseño y plantillas aprobadas"
```

---

### Task 2: Integrar preloader y limpieza del footer sin aceptar regresiones SEO

**Files:**
- Create: `assets/tiny-img-link-preloader.js`
- Modify: `layout/theme.liquid`
- Modify: `sections/footer.liquid`
- Modify: `tests/design-sync.test.mjs`
- Verify: `sections/header.liquid`
- Verify: `sections/image-with-text-overlay.liquid`
- Verify: `snippets/product-meta.liquid`

**Interfaces:**
- Consumes: asset exportado y markup actual del repositorio.
- Produces: precarga de enlaces no-cart, footer sin crédito externo y jerarquía SEO preservada.

- [ ] **Step 1: Añadir la prueba del preloader, footer y encabezados**

Agregar al final de `tests/design-sync.test.mjs`:

```js
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
```

- [ ] **Step 2: Ejecutar la prueba y observar el fallo**

Run: `node --test tests/design-sync.test.mjs`

Expected: FAIL porque `assets/tiny-img-link-preloader.js` todavía no existe.

- [ ] **Step 3: Incorporar el asset y los dos cambios quirúrgicos**

- Crear `assets/tiny-img-link-preloader.js` con el contenido literal de `/Users/usuario/Downloads/dulceavellana/assets/tiny-img-link-preloader.js` mediante `apply_patch`.
- Insertar antes de `</body>` en `layout/theme.liquid`:

```liquid
<script src="{{ 'tiny-img-link-preloader.js' | asset_url }}" defer></script>
```

- Eliminar únicamente esta línea de `sections/footer.liquid`:

```liquid
<p class="footer__small-text">Powered By <em><a href="https://www.oderway.co/"><strong>Oderway</strong></a></em></small>
```

- No modificar `sections/header.liquid`, `sections/image-with-text-overlay.liquid` ni `snippets/product-meta.liquid`.

- [ ] **Step 4: Ejecutar ambas suites**

Run: `node --test tests/design-sync.test.mjs tests/menu-informational.test.mjs`

Expected: 17 pruebas aprobadas, 0 fallos.

- [ ] **Step 5: Registrar los cambios de runtime**

```bash
git add assets/tiny-img-link-preloader.js layout/theme.liquid sections/footer.liquid tests/design-sync.test.mjs
git commit -m "feat: completar ajustes visuales exportados"
```

---

### Task 3: Verificación de integridad, Theme Check y entrega

**Files:**
- Verify: todos los archivos modificados en Tasks 1 y 2
- Verify unchanged: `sections/menu-list.liquid`
- Verify unchanged: `snippets/menu-dietary-indicators.liquid`
- Verify unchanged: `templates/page.menu.json`
- Verify unchanged: `tests/menu-informational.test.mjs`

**Interfaces:**
- Consumes: los dos commits de implementación.
- Produces: rama `staging` verificada y Pull Request contra `main`.

- [ ] **Step 1: Confirmar hashes de las funcionalidades protegidas**

Run:

```bash
printf '%s  %s\n' \
  d2cae5135fcdef0aa8157ca3d7dbbbd1a0dec6d560945fbab4b6823758d1ee8b sections/menu-list.liquid \
  416a331fbd7ef9b7499438444dfb69ce2c8680c2d8fa31a07bbe92f7778dcf8c snippets/menu-dietary-indicators.liquid \
  debddddb0993815124b09ec7bdab600834baca13859ffbc8f2a6f6102e705f3d templates/page.menu.json \
  fa2c06c396db1840d8686f9781dc163246287a316919cd43d5866a1561532f40 tests/menu-informational.test.mjs | shasum -a 256 -c
```

Expected: los cuatro archivos reportan `OK`.

- [ ] **Step 2: Ejecutar validación automatizada completa**

Run:

```bash
node --test tests/*.test.mjs
for file in config/settings_data.json templates/*.json; do jq empty "$file" || exit 1; done
git diff --check main...HEAD
```

Expected: 17/17 pruebas, JSON válido y diff sin errores de whitespace.

- [ ] **Step 3: Ejecutar Shopify Theme Check y clasificar resultados**

Run: `shopify theme check --path .`

Expected: ningún error nuevo causado por los archivos de esta integración. Comparar cualquier hallazgo con la línea base del tema y documentar referencias `shopify://` que solo puedan verificarse en la tienda.

- [ ] **Step 4: Revisar la lista exacta del diff**

Run: `git diff --name-status main...HEAD`

Expected: solo la especificación, este plan, `tests/design-sync.test.mjs` y los archivos permitidos por Tasks 1 y 2.

- [ ] **Step 5: Publicar staging y crear Pull Request**

```bash
git push -u origin staging
gh pr create --base main --head staging --title "Nivelar frontend con diseño aprobado" --body "Integra selectivamente la configuración visual, contenido y plantillas de la exportación aprobada. Conserva el menú informativo y la jerarquía semántica existente."
```

No ejecutar ningún comando de publicación de tema Shopify.
