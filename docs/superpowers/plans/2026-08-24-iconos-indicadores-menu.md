# Iconos SVG para indicadores alimentarios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir los iconos alimentarios genéricos del menú por los seis SVG suministrados, optimizados y accesibles.

**Architecture:** `snippets/menu-dietary-indicators.liquid` seguirá siendo el único componente que decide qué indicador renderizar. Cada geometría se capturará una vez como SVG en línea, con `fill="currentColor"`, y se reutilizará para tarjetas y modal; Vegetariano y Vegano compartirán la captura `vegetarian_icon`.

**Tech Stack:** Shopify Liquid, SVG en línea, CSS existente, Node.js `node:test`, Shopify Theme Check.

## Global Constraints

- Mantener los siete controles y textos actuales del editor de Shopify.
- Usar `mani.svg`, `nueses.svg`, `gruten.svg`, `lateos.svg`, `picante.svg` y `vegetariano.svg` según la correspondencia aprobada.
- Reutilizar `vegetariano.svg` para Vegetariano y Vegano con etiquetas accesibles independientes.
- Eliminar XML, comentarios, namespaces y metadatos de Adobe Illustrator.
- Conservar las dimensiones, espaciado y colores actuales en tarjetas y modal.

---

### Task 1: Contrato automatizado de los iconos suministrados

**Files:**
- Modify: `tests/menu-informational.test.mjs`
- Test: `tests/menu-informational.test.mjs`

**Interfaces:**
- Consumes: contenido textual de `snippets/menu-dietary-indicators.liquid`.
- Produces: contrato que exige seis capturas específicas, siete asignaciones y SVG optimizados.

- [ ] **Step 1: Cargar el snippet y escribir la prueba que debe fallar**

Agregar junto a las constantes iniciales:

```js
const dietarySnippet = readFileSync(new URL('../snippets/menu-dietary-indicators.liquid', import.meta.url), 'utf8');
```

Agregar después de la prueba existente de indicadores:

```js
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
```

- [ ] **Step 2: Ejecutar la prueba y confirmar el fallo**

Run: `node --test tests/menu-informational.test.mjs`

Expected: FAIL en `dietary indicators use the supplied optimized SVG artwork` por ausencia de `peanut_icon`.

- [ ] **Step 3: Commit del contrato rojo**

```bash
git add tests/menu-informational.test.mjs
git commit -m "test: definir iconos alimentarios suministrados"
```

---

### Task 2: Integrar y verificar los seis SVG optimizados

**Files:**
- Modify: `snippets/menu-dietary-indicators.liquid`
- Test: `tests/menu-informational.test.mjs`

**Interfaces:**
- Consumes: los seis archivos fuente de `/Users/usuario/Downloads/` y las variables Liquid `item` y `compact`.
- Produces: capturas Liquid `peanut_icon`, `tree_nut_icon`, `gluten_icon`, `dairy_icon`, `spicy_icon` y `vegetarian_icon`.

- [ ] **Step 1: Reemplazar las tres capturas genéricas por seis SVG limpios**

Para cada archivo fuente, copiar literalmente todos sus elementos `<path>` anteriores a `<metadata>` dentro de una captura Liquid con `<svg aria-hidden="true" fill="currentColor">`. Usar esta correspondencia exacta de nombre, fuente y `viewBox`:

| Captura | Fuente | `viewBox` |
| --- | --- | --- |
| `peanut_icon` | `/Users/usuario/Downloads/mani.svg` | `0 0 512 512` |
| `tree_nut_icon` | `/Users/usuario/Downloads/nueses.svg` | `0 0 384 384` |
| `gluten_icon` | `/Users/usuario/Downloads/gruten.svg` | `0 0 384 384` |
| `dairy_icon` | `/Users/usuario/Downloads/lateos.svg` | `0 0 384 384` |
| `spicy_icon` | `/Users/usuario/Downloads/picante.svg` | `0 0 384 384` |
| `vegetarian_icon` | `/Users/usuario/Downloads/vegetariano.svg` | `0 0 36 36` |

No copiar `<metadata>`, `xmlns:i`, `id="Layer_1"`, declaraciones XML ni comentarios.

- [ ] **Step 2: Conectar cada indicador con su captura aprobada**

Mantener las clases, títulos y textos existentes, cambiando únicamente las variables renderizadas:

```liquid
{{ peanut_icon }}
{{ tree_nut_icon }}
{{ gluten_icon }}
{{ dairy_icon }}
{{ spicy_icon }}
{{ vegetarian_icon }}
{{ vegetarian_icon }}
```

en el orden Maní, Frutos secos, Gluten, Lácteos, Picante, Vegetariano y Vegano.

- [ ] **Step 3: Ejecutar la suite del menú**

Run: `node --test tests/menu-informational.test.mjs`

Expected: 13 tests, 13 passed, 0 failed.

- [ ] **Step 4: Ejecutar Theme Check sobre el tema mínimo**

Crear un directorio temporal con `layout/theme.liquid`, `config/settings_schema.json`, `sections/menu-list.liquid`, `snippets/menu-dietary-indicators.liquid` y `templates/page.menu.json`, y ejecutar:

```bash
shopify theme check --path "$MENU_THEME_CHECK_DIR"
```

Expected: 0 errores; se toleran únicamente los ocho avisos conocidos `UnclosedHTMLElement` del agrupamiento dinámico de categorías.

- [ ] **Step 5: Revisar el diff y confirmar que no hay metadatos**

Run: `git diff --check && rg -n '<metadata|AdobeIllustrator|xmlns:i|<\?xml' snippets/menu-dietary-indicators.liquid`

Expected: `git diff --check` sin salida y `rg` sin coincidencias.

- [ ] **Step 6: Commit de la implementación**

```bash
git add snippets/menu-dietary-indicators.liquid
git commit -m "feat: usar iconos alimentarios personalizados"
```

---

### Task 3: Verificación final y publicación de la rama

**Files:**
- Verify: `snippets/menu-dietary-indicators.liquid`
- Verify: `tests/menu-informational.test.mjs`

**Interfaces:**
- Consumes: implementación y pruebas de las tareas anteriores.
- Produces: rama verificada lista para Pull Request.

- [ ] **Step 1: Ejecutar nuevamente la prueba completa y revisar el estado**

Run: `node --test tests/menu-informational.test.mjs && git diff --check && git status --short --branch`

Expected: 13/13 pruebas aprobadas, diff limpio y únicamente commits intencionales por delante de `origin/main`.

- [ ] **Step 2: Publicar y crear Pull Request**

```bash
git push -u origin codex/menu-indicator-icons
gh pr create --base main --head codex/menu-indicator-icons --title "Actualizar iconos de indicadores alimentarios" --body "Reemplaza los iconos genéricos por los SVG suministrados, optimizados y accesibles. Reutiliza el icono vegetariano para Vegano."
```
