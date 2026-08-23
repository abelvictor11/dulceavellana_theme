# Adiciones del Menú Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir al modal del menú un simulador informativo de presentaciones y adiciones con herencia por categoría, límites de selección y total estimado.

**Architecture:** Los bloques `category` guardarán un grupo predeterminado y los bloques `item` elegirán heredar, omitir o reemplazarlo. Liquid resolverá el grupo efectivo mientras recorre los bloques y lo serializará como controles HTML nativos; JavaScript aislado por modal calculará el total, limitará checkboxes y restablecerá el estado al cerrar.

**Tech Stack:** Shopify Liquid y schema JSON, HTML `fieldset`/`radio`/`checkbox`, CSS responsivo, JavaScript DOM y Node Test Runner.

## Global Constraints

- Un solo grupo efectivo por producto, con hasta ocho adiciones.
- Importes enteros no negativos en pesos colombianos, formateados con `Intl.NumberFormat('es-CO')`.
- Tres modos de producto: `inherit`, `none` y `custom`.
- El mínimo es informativo; el máximo sí deshabilita opciones adicionales.
- Sin carrito, envío, persistencia, cantidades ni varios grupos simultáneos.
- Cerrar el modal restablece presentación, adiciones, contador y total.

---

### Task 1: Ampliar el contrato de datos y la plantilla

**Files:**
- Modify: `tests/menu-informational.test.mjs`
- Modify: `sections/menu-list.liquid`
- Modify: `templates/page.menu.json`

**Interfaces:**
- Consumes: bloques actuales `category` e `item`.
- Produces: ajustes `additions_*` en categoría; `additions_behavior` y `custom_additions_*` en ítem; precios numéricos `base_price` y `option_N_price`.

- [ ] **Step 1: Escribir prueba fallida del schema**

Añadir aserciones que comprueben en categoría `additions_title`, `additions_help`, `additions_min`, `additions_max` y los pares `addition_1_name`/`addition_1_price` a `addition_8_*`; y en ítem `additions_behavior`, `custom_additions_title`, `custom_additions_help`, `custom_additions_min`, `custom_additions_max` y los pares `custom_addition_1_*` a `custom_addition_8_*`.

Comprobar además que `base_price` y `option_1_price` son de tipo `number`, con mínimo `0`.

- [ ] **Step 2: Ejecutar la prueba roja**

```bash
node --test tests/menu-informational.test.mjs
```

Expected: FAIL indicando `missing category setting: additions_title`.

- [ ] **Step 3: Implementar campos de categoría**

En el bloque `category`, añadir título/ayuda, rangos mínimo 0–8 y máximo 1–8, y ocho pares nombre/precio. Los precios serán `number` con `default: 0` y límite mínimo `0`.

- [ ] **Step 4: Implementar excepción por producto**

En el bloque `item`, añadir selector `additions_behavior` con valores `inherit`, `none`, `custom` y default `inherit`. Añadir el grupo propio completo con prefijo `custom_`. Convertir `base_price` y los cuatro `option_N_price` a `number`, default `0`, mínimo `0`.

- [ ] **Step 5: Actualizar la plantilla inicial**

En `page.menu.json`, configurar categorías con grupo vacío, mínimo 0, máximo 2 y ocho precios cero. Configurar cada ítem con `additions_behavior: "inherit"`, precios base/opciones numéricos y grupo propio vacío.

- [ ] **Step 6: Ejecutar pruebas y validar JSON**

```bash
node --test tests/menu-informational.test.mjs
node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('templates/page.menu.json')); const s=fs.readFileSync('sections/menu-list.liquid','utf8'); JSON.parse(s.match(/{% schema %}([\\s\\S]*?){% endschema %}/)[1]);"
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add tests/menu-informational.test.mjs sections/menu-list.liquid templates/page.menu.json
git commit -m "feat: configure inherited menu additions"
```

### Task 2: Renderizar selector y calcular total

**Files:**
- Modify: `tests/menu-informational.test.mjs`
- Modify: `sections/menu-list.liquid`

**Interfaces:**
- Consumes: campos creados en Task 1.
- Produces: `[data-menu-presentation]`, `[data-menu-addition]`, `[data-menu-total]`, `[data-menu-selection-status]`; funciones `formatMoney`, `normalizeLimits`, `updateEstimate` y `resetConfigurator`.

- [ ] **Step 1: Escribir prueba fallida del contrato interactivo**

Comprobar que la sección contiene controles `type="radio"` y `type="checkbox"`, `fieldset`, `aria-live="polite"`, los cuatro atributos `data-menu-*` anteriores, los tres valores de comportamiento y las funciones `formatMoney`, `normalizeLimits`, `updateEstimate`, `resetConfigurator`.

- [ ] **Step 2: Ejecutar la prueba roja**

```bash
node --test tests/menu-informational.test.mjs
```

Expected: FAIL indicando `missing additions behavior: data-menu-addition`.

- [ ] **Step 3: Resolver el grupo efectivo en Liquid**

Mantener variables de categoría actuales `category_additions_*`. En cada bloque `category`, actualizarlas desde sus ajustes. En cada ítem:

- `none`: `effective_additions_count = 0`.
- `inherit`: leer título, ayuda, límites y opciones desde las variables de categoría.
- `custom`: leer los campos con prefijo `custom_` del ítem.

Contar solo opciones con nombre. Limitar máximo al conteo y mínimo al máximo. Mostrar `Personalizable` en la tarjeta cuando el conteo sea mayor que cero.

- [ ] **Step 4: Renderizar presentaciones y adiciones**

Cambiar las presentaciones del modal a `fieldset` con radios; la primera opción válida inicia marcada. Renderizar el grupo efectivo como `fieldset` con checkboxes, `data-price` numérico y máximo normalizado en el contenedor. Mostrar `Sin costo` para cero y `+ <precio>` para valores positivos.

Añadir región con contador `[data-menu-selection-status]` y resumen `[data-menu-total]` con `aria-live="polite"`. Ocultar el resumen cuando no exista precio base ni presentación válida.

- [ ] **Step 5: Implementar cálculo y límites**

```javascript
function formatMoney(value) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}
```

`updateEstimate(dialog)` suma el radio marcado y los checkboxes marcados, actualiza total/contador y deshabilita únicamente checkboxes no marcados cuando `selected >= max`. El mensaje usa `Selecciona al menos N` si falta el mínimo; en otro caso muestra `N de M seleccionadas`.

`resetConfigurator(dialog)` marca el primer radio, desmarca y habilita todos los checkboxes, y llama a `updateEstimate`. Invocarla en `closeDialog` después de ocultar y antes de devolver el foco.

- [ ] **Step 6: Ejecutar pruebas y Theme Check aislado**

```bash
node --test tests/menu-informational.test.mjs
shopify theme check --path /private/tmp/dulceavellana-menu-check --no-color --fail-level error
git diff --check
```

Expected: pruebas PASS, cero errores atribuibles a los archivos del menú y diff limpio.

- [ ] **Step 7: Commit**

```bash
git add tests/menu-informational.test.mjs sections/menu-list.liquid
git commit -m "feat: calculate informational menu additions"
```

### Task 3: Verificación de regresión y actualización del PR

**Files:**
- Modify only if verification finds a defect: `sections/menu-list.liquid`
- Modify only if verification finds a defect: `templates/page.menu.json`
- Modify only if verification finds a defect: `tests/menu-informational.test.mjs`

**Interfaces:**
- Consumes: implementación completa.
- Produces: rama verificada y PR actualizado.

- [ ] **Step 1: Ejecutar suite completa del menú**

```bash
node --test tests/menu-informational.test.mjs
```

Expected: 0 fallos.

- [ ] **Step 2: Revisar restricciones eliminatorias**

```bash
if rg -n "cartAddUrl|data-menu-add|/cart/|fetch\(" sections/menu-list.liquid; then exit 1; fi
git diff --check origin/main...HEAD
git status --short
```

Expected: sin carrito, diff limpio y sin archivos temporales.

- [ ] **Step 3: Inspección manual dirigida**

Comprobar herencia, `none`, `custom`, ocho extras, límites 0–2 y 1–1, presentación con cambio de base, opción sin costo, restablecimiento al cerrar, teclado y anchos 375/1280 px.

- [ ] **Step 4: Publicar la rama existente**

```bash
git push origin codex/menu-informativo
```

Expected: el PR #2 recibe los commits nuevos sin force-push.
