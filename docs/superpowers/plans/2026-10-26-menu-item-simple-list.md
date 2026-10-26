# Vista de lista para ítems simples Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el bloque `item_simple` existente en una fila compacta, sin alterar las tarjetas `item` ni el modal.

**Architecture:** La sección ya distingue `item_simple` con `MenuItem--simple`. El cambio se limita a reglas CSS específicas que anulan la altura, fondo, borde y geometría de tarjeta, extienden la fila a todo el grid y alinean contenido/precio como lista.

**Tech Stack:** Shopify Liquid, CSS, Node.js `node:test`, Shopify Theme Check.

**Spec:** `docs/superpowers/specs/2026-10-26-menu-item-simple-list-design.md`

## Global Constraints

- Solo `item_simple` usa la vista lista.
- No cambiar schema, datos, bloques `item`, modal ni categorías.
- Mantener nombre, etiqueta, descripción breve y precio.
- La PR debe partir de `origin/main` y apuntar a `main`.
- El diff solo incluye los cuatro archivos de este ajuste.

## Review Focus

- Varias filas simples consecutivas deben conservar separación clara.
- Una fila simple sin descripción debe mantenerse compacta.
- Etiquetas opcionales no deben forzar altura de tarjeta.
- Móvil no debe reintroducir la geometría de `.MenuItem__Button`.
- Las tarjetas completas deben conservar su CSS actual.

---

### Task 1: Compactar el bloque item_simple

**Files:**
- Modify: `sections/menu-list.liquid`
- Modify: `tests/menu-informational.test.mjs`
- Create: `docs/superpowers/specs/2026-10-26-menu-item-simple-list-design.md`
- Create: `docs/superpowers/plans/2026-10-26-menu-item-simple-list.md`

**Interfaces:**
- Consumes: markup existente `.MenuItem--simple .MenuItem__Button--static`.
- Produces: fila de ancho completo y altura natural para `item_simple`.

- [ ] **Step 1:** Añadir una prueba que exija `grid-column: 1 / -1`, `min-height: 0`, `height: auto`, fondo transparente y distribución compacta.
- [ ] **Step 2:** Ejecutar `node --test tests/menu-informational.test.mjs` y observar el fallo por reglas ausentes.
- [ ] **Step 3:** Añadir las reglas específicas de lista a `sections/menu-list.liquid`, incluida adaptación móvil.
- [ ] **Step 4:** Ejecutar la suite completa, Theme Check, validador Liquid y `git diff --check`.
- [ ] **Step 5:** Revisar el diff contra `origin/main`, confirmar cuatro archivos y crear PR hacia `main`.
