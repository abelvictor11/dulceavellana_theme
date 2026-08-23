# Precio e Indicadores Alimentarios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir el total inicial del modal y mostrar siete indicadores alimentarios configurables en tarjeta y modal.

**Architecture:** Liquid considerará presentación válida solo cuando tenga nombre; JavaScript conservará el precio base si no hay radio marcado. Siete checkboxes de schema generarán badges mediante un snippet SVG reutilizable dentro de la sección.

**Tech Stack:** Shopify Liquid/schema JSON, SVG inline, CSS, JavaScript DOM y Node Test Runner.

## Global Constraints

- El total inicial nunca será cero por presentaciones vacías.
- Solo presentaciones con nombre generan radios.
- Indicadores: maní, frutos secos, gluten, lácteos, picante, vegetariano y vegano.
- Iconos visibles en tarjeta; icono y texto en modal.
- Sin dependencias externas ni JavaScript para iconos.

---

### Task 1: Corregir la base del total

**Files:**
- Modify: `tests/menu-informational.test.mjs`
- Modify: `sections/menu-list.liquid`

- [ ] Escribir prueba fallida que exija `option_name != blank` como única condición de render y una función `getBasePrice(dialog)` con fallback a `data-base-price`.
- [ ] Ejecutar `node --test tests/menu-informational.test.mjs`; esperar fallo por `getBasePrice` ausente.
- [ ] Cambiar `has_options` y el render de presentaciones para ignorar precios cero sin nombre; marcar la primera presentación válida mediante una variable Liquid, no `forloop.first`.
- [ ] Implementar `getBasePrice(dialog)` y usarla en `updateEstimate`; devolver radio marcado cuando exista o `data-base-price` en caso contrario.
- [ ] Ejecutar pruebas hasta obtener PASS.

### Task 2: Añadir indicadores alimentarios

**Files:**
- Modify: `tests/menu-informational.test.mjs`
- Modify: `sections/menu-list.liquid`
- Modify: `templates/page.menu.json`

- [ ] Escribir prueba fallida que exija siete settings booleanos y contratos `[data-menu-dietary-card]` / `[data-menu-dietary-modal]`.
- [ ] Ejecutar la prueba roja.
- [ ] Añadir checkboxes `contains_peanuts`, `contains_tree_nuts`, `contains_gluten`, `contains_dairy`, `is_spicy`, `is_vegetarian`, `is_vegan` al bloque `item`, todos en `false`.
- [ ] Capturar los siete estados en cada ítem y renderizar solo los activos. En tarjeta usar SVG + texto visualmente oculto + `title`; en modal SVG + etiqueta visible.
- [ ] Añadir estilos compactos, diferenciando advertencias y atributos sin depender solo del color.
- [ ] Actualizar la plantilla con los siete valores `false` para sus ítems iniciales.
- [ ] Ejecutar pruebas, validar JavaScript/schema/JSON y `git diff --check`.

### Task 3: Validar y publicar

**Files:**
- Modify only if verification finds a defect: menu files and tests.

- [ ] Copiar archivos al tema mínimo y ejecutar `shopify theme check --path /private/tmp/dulceavellana-menu-check --no-color --fail-level error`.
- [ ] Ejecutar `node --test tests/menu-informational.test.mjs`; esperar cero fallos.
- [ ] Commit con `git commit -m "fix: correct menu totals and add dietary indicators"`.
- [ ] Publicar `codex/menu-precio-indicadores` y crear PR hacia `main`.
