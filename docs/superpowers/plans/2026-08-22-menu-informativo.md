# Menú Informativo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir `page.menu` en una carta informativa administrable por bloques, independiente de productos, colecciones, variantes y carrito de Shopify.

**Architecture:** `sections/menu-list.liquid` será una sección autocontenida con bloques secuenciales `category` y `item`. Liquid agrupará visualmente cada ítem bajo la categoría precedente, cada ítem incluirá su tarjeta y diálogo, y JavaScript delegado aislado por `section.id` administrará navegación, galería, foco y cierre.

**Tech Stack:** Shopify Online Store 2.0, Liquid, schema JSON, HTML semántico, CSS responsivo y JavaScript DOM sin dependencias.

## Global Constraints

- La experiencia es exclusivamente informativa: no contiene carrito, pedidos, reservas ni pagos.
- Todo se configura desde la sección; no se consultan productos, colecciones, variantes, inventario, metaobjetos ni servicios externos.
- Cada ítem admite imagen principal, tres imágenes adicionales, resumen, descripción enriquecida, etiqueta y hasta cuatro nombres/precios de presentación.
- Los precios son texto libre; con presentaciones la tarjeta usa el prefijo configurable `Desde`.
- El modal se cierra con botón, fondo o `Esc`, bloquea el scroll, atrapa el foco y lo devuelve al disparador.
- La sección funciona con recargas del editor de temas y múltiples instancias.

---

### Task 1: Reemplazar el modelo de catálogo por bloques informativos

**Files:**
- Modify: `sections/menu-list.liquid`

**Interfaces:**
- Consumes: `section.settings`, `section.blocks`, variables CSS del tema y eventos del editor de Shopify.
- Produces: raíz `#Menu-{{ section.id }}`, bloques `category` e `item`, tarjetas `[data-menu-open]`, diálogos `[data-menu-dialog]` y navegación `[data-menu-filter]`.

- [ ] **Step 1: Registrar la regresión inicial**

```bash
rg -n "collections\[|collection\.products|product\.|variant|cartAddUrl|data-menu-add" sections/menu-list.liquid
```

Expected: encuentra dependencias actuales del catálogo y carrito.

- [ ] **Step 2: Sustituir markup y agrupación de bloques**

Recorrer `section.blocks` en orden. Al encontrar `category`, cerrar la cuadrícula/categoría anterior y abrir `MenuCategory`; al encontrar `item`, abrir una categoría general si aún no existe y renderizar una tarjeta solo cuando `block.settings.title != blank`. Cerrar los contenedores abiertos al terminar.

Interfaz mínima de la tarjeta:

```liquid
<article class="MenuItem" data-menu-item {{ block.shopify_attributes }}>
  <button type="button" class="MenuItem__HitArea" data-menu-open="MenuDialog-{{ section.id }}-{{ block.id }}" aria-haspopup="dialog">
    <span class="visually-hidden">{{ section.settings.detail_button_label | escape }}: {{ block.settings.title | escape }}</span>
  </button>
  <!-- imagen, etiqueta, nombre, resumen, precio y botón visible -->
</article>
```

Cada ítem emitirá un diálogo identificado por `MenuDialog-{{ section.id }}-{{ block.id }}` con `role="dialog"`, `aria-modal="true"`, `aria-labelledby` y botones `[data-menu-close]`. Las opciones 1–4 solo se mostrarán si nombre o precio existe; las imágenes 1–3 solo cuando estén configuradas.

- [ ] **Step 3: Implementar estilos responsive y accesibles**

Mantener estilos bajo `#Menu-{{ section.id }}`. Usar `section.settings.grid_columns` en escritorio y una columna por debajo de 700 px. La tarjeta será horizontal con imagen dimensionada por `image_size`; el diálogo tendrá fondo, panel centrado, scroll interno, galería y dos columnas en escritorio. Añadir `:focus-visible`, marcador sin imagen y clase `MenuModalOpen` con `overflow: hidden`.

- [ ] **Step 4: Implementar navegación, galería y diálogo**

Crear `initMenu(root)` con guardia `root.dataset.menuInitialized` y estas funciones:

```javascript
openDialog(dialog, trigger)
closeDialog(dialog)
selectImage(button)
scrollToCategory(button)
```

`openDialog` guarda `activeTrigger`, añade `is-open`, bloquea el documento y enfoca el cierre. `closeDialog` revierte estados y devuelve el foco. `keydown` cierra con `Escape` y mantiene `Tab` entre elementos enfocables. El fondo solo cierra cuando `event.target === dialog`. Las miniaturas actualizan `src`, `srcset`, `alt` y `aria-pressed` de la imagen principal.

Inicializar al cargar y en `shopify:section:load`; limpiar el bloqueo en `shopify:section:unload`.

- [ ] **Step 5: Reemplazar el schema**

Conservar encabezado y colores útiles. Definir ajustes `grid_columns` (default `"2"`), `image_size` (132), `card_radius` (18), `modal_radius` (20), `detail_button_label` (`Ver detalles`), `from_label` (`Desde`) y `general_category_label` (`Otros`).

Definir bloque `category` con `title` y `description`. Definir bloque `item` con `title`, `badge`, `image`, `short_description`, `description`, `base_price`, pares `option_1_name`/`option_1_price` hasta `option_4_*`, y `gallery_image_1` hasta `gallery_image_3`.

- [ ] **Step 6: Verificar ausencia de dependencias antiguas**

```bash
if rg -n "collections\[|collection\.products|product\.|variant|cartAddUrl|data-menu-add" sections/menu-list.liquid; then exit 1; fi
```

Expected: PASS sin salida.

- [ ] **Step 7: Validar el schema**

```bash
node -e "const fs=require('fs'); const s=fs.readFileSync('sections/menu-list.liquid','utf8'); const m=s.match(/{% schema %}([\\s\\S]*?){% endschema %}/); if(!m) throw Error('schema missing'); JSON.parse(m[1]);"
```

Expected: PASS sin salida.

- [ ] **Step 8: Commit**

```bash
git add sections/menu-list.liquid
git commit -m "feat: replace product menu with informational cards"
```

### Task 2: Configurar una plantilla inicial útil

**Files:**
- Modify: `templates/page.menu.json`

**Interfaces:**
- Consumes: tipos y claves del schema de `sections/menu-list.liquid`.
- Produces: instancia válida ordenada `category → item → item → category → item`.

- [ ] **Step 1: Confirmar claves anteriores**

```bash
rg -n 'products_limit|add_button_label|added_button_label|layout_mode' templates/page.menu.json
```

Expected: encuentra al menos una clave antigua.

- [ ] **Step 2: Actualizar bloques y valores iniciales**

Crear dos categorías y tres ítems vacíos ordenados. No asignar imágenes ficticias. Configurar `grid_columns: "2"`, `image_size: 132`, `card_radius: 18`, `modal_radius: 20`, `detail_button_label: "Ver detalles"`, `from_label: "Desde"` y `general_category_label: "Otros"`.

- [ ] **Step 3: Validar JSON y orden**

```bash
node -e "const fs=require('fs'); const page=JSON.parse(fs.readFileSync('templates/page.menu.json')); if(page.sections.menu.type!=='menu-list') throw Error('wrong section'); const types=page.sections.menu.block_order.map(id=>page.sections.menu.blocks[id].type); if(types.join(',')!=='category,item,item,category,item') throw Error(types.join(','));"
```

Expected: PASS sin salida.

- [ ] **Step 4: Commit**

```bash
git add templates/page.menu.json
git commit -m "chore: seed informational menu template"
```

### Task 3: Verificación integral y ajustes finales

**Files:**
- Modify if required: `sections/menu-list.liquid`
- Modify if required: `templates/page.menu.json`

**Interfaces:**
- Consumes: sección y plantilla terminadas.
- Produces: implementación validada contra la especificación.

- [ ] **Step 1: Ejecutar Shopify Theme Check**

```bash
shopify theme check --path .
```

Expected: exit 0. Registrar avisos preexistentes ajenos y corregir todo error atribuible a los dos archivos modificados.

- [ ] **Step 2: Ejecutar validaciones estructurales**

```bash
node -e "const fs=require('fs'); const s=fs.readFileSync('sections/menu-list.liquid','utf8'); const schema=JSON.parse(s.match(/{% schema %}([\\s\\S]*?){% endschema %}/)[1]); const ids=new Set(schema.settings.map(x=>x.id).filter(Boolean)); for(const id of ['grid_columns','image_size','card_radius','modal_radius','detail_button_label','from_label','general_category_label']) if(!ids.has(id)) throw Error('missing '+id); const blocks=new Set(schema.blocks.map(x=>x.type)); if(!blocks.has('category')||!blocks.has('item')) throw Error('block types'); JSON.parse(fs.readFileSync('templates/page.menu.json'));"
if rg -n "collections\[|collection\.products|product\.|variant|/cart/|data-menu-add" sections/menu-list.liquid; then exit 1; fi
git diff --check
```

Expected: exit 0 sin errores.

- [ ] **Step 3: Inspección manual dirigida**

Con vista previa a 375 px y 1280 px comprobar: navegación sin tapar títulos; marcador sin imagen; diálogo exclusivo por tarjeta; cuatro opciones y cuatro imágenes; cierre con `Esc`, fondo y botón; foco atrapado y devuelto; listeners no duplicados; ninguna clase de scroll residual.

- [ ] **Step 4: Revisar el diff completo**

```bash
git diff HEAD~2 -- sections/menu-list.liquid templates/page.menu.json
git status --short
```

Expected: solo cambios previstos y ningún archivo temporal.

- [ ] **Step 5: Commit de correcciones, solo si existen**

```bash
git add sections/menu-list.liquid templates/page.menu.json
git commit -m "fix: polish informational menu interactions"
```
