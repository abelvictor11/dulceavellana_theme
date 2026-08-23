# Dos Grupos de Adiciones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que cada producto muestre simultáneamente adiciones sencillas y especiales, con herencia, excepciones, límites y cálculo independientes.

**Architecture:** El Grupo 1 conserva todos sus campos existentes. Un Grupo 2 paralelo usa prefijo `secondary_` en categoría y `custom_secondary_` en producto; Liquid resolverá ambos grupos efectivos y reutilizará el mismo componente HTML, mientras el cálculo existente recorrerá todos los fieldsets de adiciones.

**Tech Stack:** Shopify Liquid/schema JSON, HTML accesible, JavaScript DOM, Node Test Runner y Shopify Theme Check.

## Global Constraints

- Compatibilidad total con el Grupo 1 existente.
- Máximo inicial 3 e independiente para cada grupo; mínimo inicial 0.
- Hasta ocho opciones por grupo.
- Cada grupo de cada producto puede heredar, ocultarse o reemplazarse.
- El total suma presentación, Grupo 1 y Grupo 2.
- Sin límite combinado, cantidades, tercer grupo, carrito ni persistencia.

---

### Task 1: Añadir el contrato del Grupo 2

**Files:**
- Modify: `tests/menu-informational.test.mjs`
- Modify: `sections/menu-list.liquid`
- Modify: `templates/page.menu.json`

**Interfaces:**
- Consumes: schema actual del Grupo 1.
- Produces: categoría `secondary_additions_*` / `secondary_addition_N_*`; ítem `secondary_additions_behavior` / `custom_secondary_additions_*` / `custom_secondary_addition_N_*`.

- [ ] **Step 1: Escribir prueba fallida del schema secundario**

Añadir una prueba que exija título, ayuda, mínimo, máximo y opciones 1/8 del Grupo 2 en categoría; y selector de comportamiento, límites y opciones propias 1/8 en ítem. Verificar default `3` en ambos máximos.

- [ ] **Step 2: Ejecutar RED**

```bash
node --test tests/menu-informational.test.mjs
```

Expected: FAIL con `missing secondary category setting`.

- [ ] **Step 3: Añadir campos de categoría**

Agregar `secondary_additions_title` con default `Adiciones especiales`, ayuda, mínimo 0, máximo 3 y ocho pares `secondary_addition_N_name`/`price`.

- [ ] **Step 4: Añadir campos de producto**

Agregar `secondary_additions_behavior` (`inherit`, `none`, `custom`) y el grupo propio completo con prefijo `custom_secondary_`, título inicial `Adiciones especiales`, mínimo 0 y máximo 3.

- [ ] **Step 5: Sembrar valores seguros en la plantilla**

Añadir a categorías título secundario, límites 0/3 y precios cero. Añadir a ítems `secondary_additions_behavior: "inherit"`, límites propios 0/3 y precios cero. No añadir nombres ficticios.

- [ ] **Step 6: Ejecutar GREEN y validar JSON**

```bash
node --test tests/menu-informational.test.mjs
node -e "const fs=require('fs');JSON.parse(fs.readFileSync('templates/page.menu.json'));const s=fs.readFileSync('sections/menu-list.liquid','utf8');JSON.parse(s.match(/{% schema %}([\\s\\S]*?){% endschema %}/)[1]);"
```

Expected: PASS.

### Task 2: Resolver y renderizar ambos grupos

**Files:**
- Modify: `tests/menu-informational.test.mjs`
- Modify: `sections/menu-list.liquid`

**Interfaces:**
- Consumes: campos de Task 1.
- Produces: dos contenedores `[data-menu-additions]` con `data-additions-group="primary|secondary"` y comportamiento independiente.

- [ ] **Step 1: Escribir prueba fallida del doble grupo**

Exigir marcadores literales `data-additions-group="primary"`, `data-additions-group="secondary"`, `secondary_additions_behavior` y un recorrido múltiple `querySelectorAll('[data-menu-additions]')`.

- [ ] **Step 2: Ejecutar RED**

```bash
node --test tests/menu-informational.test.mjs
```

Expected: FAIL por ausencia de `data-additions-group="secondary"`.

- [ ] **Step 3: Resolver el Grupo 2 en Liquid**

Al abrir una categoría conservar `category_additions` para ambos prefijos. En cada ítem resolver Grupo 1 con el comportamiento existente y Grupo 2 mediante `secondary_additions_behavior`; para `custom`, usar fuente `block.settings` y prefijo `custom_secondary_`; para herencia, fuente de categoría y prefijo `secondary_`; para `none`, fuente nula.

- [ ] **Step 4: Extraer render repetible con capture**

Renderizar ambos grupos con la misma estructura `fieldset`, iterando 1–8. Cada grupo tendrá título, ayuda, límites, checkboxes, precios y contador propios. Omitirlo cuando ninguna opción tenga nombre.

- [ ] **Step 5: Generalizar cálculo y reset**

Cambiar `querySelector('[data-menu-additions]')` por `querySelectorAll`. Para cada grupo: normalizar límites, sumar sus seleccionadas, deshabilitar solo sus no seleccionadas y actualizar su contador. `resetConfigurator` ya debe desmarcar/habilitar todos los checkboxes y llamará una vez a `updateEstimate`.

- [ ] **Step 6: Ejecutar GREEN**

```bash
node --test tests/menu-informational.test.mjs
```

Expected: todas las pruebas PASS.

### Task 3: Verificar y publicar

**Files:**
- Modify only if a defect appears: `sections/menu-list.liquid`
- Modify only if a defect appears: `templates/page.menu.json`
- Modify only if a defect appears: `tests/menu-informational.test.mjs`

**Interfaces:**
- Consumes: implementación terminada.
- Produces: rama y PR nuevos contra `main`.

- [ ] **Step 1: Validar pruebas, JavaScript y schema**

```bash
node --test tests/menu-informational.test.mjs
node -e "const fs=require('fs');const s=fs.readFileSync('sections/menu-list.liquid','utf8');new Function(s.match(/<script>([\\s\\S]*?)<\\/script>/)[1].replaceAll('{{ uid }}','test'));JSON.parse(s.match(/{% schema %}([\\s\\S]*?){% endschema %}/)[1]);JSON.parse(fs.readFileSync('templates/page.menu.json'));"
git diff --check origin/main..HEAD
```

Expected: cero fallos y cero errores.

- [ ] **Step 2: Ejecutar Theme Check aislado**

Copiar los dos archivos del menú al tema mínimo de `/private/tmp/dulceavellana-menu-check` y ejecutar:

```bash
shopify theme check --path /private/tmp/dulceavellana-menu-check --no-color --fail-level error
```

Expected: cero errores; las advertencias conocidas de agrupación dinámica pueden permanecer.

- [ ] **Step 3: Commit y publicación**

```bash
git add sections/menu-list.liquid templates/page.menu.json tests/menu-informational.test.mjs docs/superpowers/plans/2026-08-22-dos-grupos-adiciones.md
git commit -m "feat: support two menu addition groups"
git push -u origin codex/dos-grupos-adiciones
```

- [ ] **Step 4: Crear PR**

```bash
gh pr create --base main --head codex/dos-grupos-adiciones --title "Permitir dos grupos de adiciones" --body "Añade grupos independientes de adiciones sencillas y especiales con herencia, excepciones, límites y total estimado."
```
