# Scroll Independiente del Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fijar la galería del modal en escritorio y desplazar únicamente la columna de contenido, preservando el comportamiento móvil.

**Architecture:** Un media query `min-width: 701px` convertirá panel y layout en contenedores de altura limitada, quitará el scroll del panel y lo asignará a `.MenuDialog__Content`. El media query móvil existente conservará una columna y scroll del panel completo.

**Tech Stack:** CSS responsivo dentro de Shopify Liquid, Node Test Runner y Shopify Theme Check.

## Global Constraints

- Solo cambia CSS; no cambia Liquid, schema ni JavaScript.
- Desktop: galería y cierre fijos, contenido derecho desplazable.
- Mobile hasta 700 px: comportamiento actual intacto.
- El modal respeta márgenes del viewport y contenidos cortos no muestran scroll innecesario.

---

### Task 1: Implementar y verificar el scroll dividido

**Files:**
- Modify: `tests/menu-informational.test.mjs`
- Modify: `sections/menu-list.liquid`

**Interfaces:**
- Consumes: `.MenuDialog__Panel`, `.MenuDialog__Layout`, `.MenuDialog__Gallery`, `.MenuDialog__Content`.
- Produces: reglas desktop bajo `@media (min-width: 701px)` y restauración explícita móvil.

- [ ] **Step 1: Escribir prueba fallida del contrato CSS**

Añadir una prueba que exija `@media (min-width: 701px)`, marcador comentado `Desktop split scroll`, `overflow: hidden` para el panel y `overflow-y: auto` para el contenido.

- [ ] **Step 2: Ejecutar RED**

```bash
node --test tests/menu-informational.test.mjs
```

Expected: FAIL por ausencia de `Desktop split scroll`.

- [ ] **Step 3: Implementar CSS desktop**

Dentro de `@media (min-width: 701px)`:

```css
#Menu-{{ uid }} .MenuDialog__Panel { height: min(820px, calc(100vh - 64px)); overflow: hidden; }
#Menu-{{ uid }} .MenuDialog__Layout { height: 100%; min-height: 0; }
#Menu-{{ uid }} .MenuDialog__Gallery { min-height: 0; overflow: hidden; }
#Menu-{{ uid }} .MenuDialog__Content { min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
```

Limitar la imagen principal con altura disponible y conservar miniaturas. Añadir borde sutil al contenido.

- [ ] **Step 4: Preservar móvil explícitamente**

En `@media (max-width: 700px)`, mantener `overflow-y: auto` en el panel y `overflow: visible` en contenido/galería, además de `height: auto` para layout.

- [ ] **Step 5: Ejecutar GREEN y regresión**

```bash
node --test tests/menu-informational.test.mjs
node -e "const fs=require('fs');const s=fs.readFileSync('sections/menu-list.liquid','utf8');new Function(s.match(/<script>([\\s\\S]*?)<\\/script>/)[1].replaceAll('{{ uid }}','test'));JSON.parse(s.match(/{% schema %}([\\s\\S]*?){% endschema %}/)[1]);"
git diff --check
```

Expected: todas las pruebas PASS y cero errores.

- [ ] **Step 6: Theme Check y commit**

```bash
shopify theme check --path /private/tmp/dulceavellana-menu-check --no-color --fail-level error
git add sections/menu-list.liquid tests/menu-informational.test.mjs docs/superpowers/plans/2026-08-22-modal-scroll-desktop.md
git commit -m "fix: split desktop modal scrolling"
```

- [ ] **Step 7: Actualizar rama y PR**

```bash
git push origin codex/dos-grupos-adiciones
```

Si el PR #4 ya está fusionado, rebasar este commit sobre `origin/main`, publicar una rama nueva y crear un PR separado.
