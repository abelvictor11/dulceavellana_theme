# Dos grupos de adiciones por producto

## Objetivo

Ampliar el simulador informativo para que un producto pueda ofrecer dos grupos de personalización simultáneos, normalmente `Adiciones sencillas` y `Adiciones especiales`, manteniendo herencia por categoría, excepciones por producto y cálculo de total.

## Compatibilidad

El grupo actual se conservará como Grupo 1. Sus campos, contenido y comportamiento continuarán funcionando sin migración manual. El Grupo 2 será completamente opcional; si no contiene opciones válidas no se mostrará ni alterará el cálculo.

## Configuración de categoría

Cada categoría definirá dos grupos independientes. Cada grupo tendrá:

- Título y texto de ayuda opcional.
- Mínimo configurable entre 0 y 8, con valor inicial 0.
- Máximo configurable entre 1 y 8, con valor inicial 3.
- Hasta ocho opciones con nombre y precio adicional entero en COP.

El Grupo 1 usará los campos existentes. El Grupo 2 añadirá campos equivalentes con prefijo `secondary_` y título inicial `Adiciones especiales`.

## Configuración por producto

Cada producto controlará cada grupo de forma independiente:

- `Heredar de categoría`.
- `Sin este grupo`.
- `Configuración propia`.

El selector existente controlará el Grupo 1. Un segundo selector controlará el Grupo 2. Cuando un producto use configuración propia, podrá definir título, ayuda, límites y hasta ocho opciones para ese grupo.

Esto permite combinaciones como:

- Heredar sencillas y heredar especiales.
- Heredar sencillas y ocultar especiales.
- Ocultar sencillas y usar especiales propias.
- Usar ambos grupos con configuraciones propias.

## Interacción

Los grupos efectivos se mostrarán como paneles consecutivos dentro del modal. Cada uno tendrá su propio `fieldset`, título, ayuda, lista de checkboxes y contador.

Los límites se aplicarán por separado. Con máximo 3 en ambos grupos, elegir tres sencillas deshabilitará únicamente las sencillas no elegidas; las especiales permanecerán disponibles hasta seleccionar tres.

Cada contador comunicará su propio estado, por ejemplo `2 de 3 seleccionadas`. Los mínimos seguirán siendo informativos y no bloquearán ninguna acción.

El total estimado será:

`precio base o presentación + Grupo 1 seleccionado + Grupo 2 seleccionado`

Cambiar una presentación conservará las selecciones de ambos grupos y recalculará el total. Cerrar el modal desmarcará y habilitará todas las adiciones de ambos grupos.

## Presentación visual

- Los dos paneles compartirán componentes y estilos para evitar ruido visual.
- El título del grupo será la principal separación semántica.
- Los precios adicionales usarán el mismo formato `+ $ 4.200`.
- Los paneles vacíos no ocuparán espacio.
- En móvil las filas conservarán un área táctil mínima de 44 px y el precio se mantendrá alineado a la derecha.
- La tarjeta seguirá usando una sola indicación `Personalizable`, independientemente de si tiene uno o dos grupos.

## Validaciones y estados límite

- Cada grupo normaliza sus límites contra su propio número de opciones válidas.
- Opciones sin nombre no se renderizan; precio vacío o cero se muestra como `Sin costo`.
- Un grupo heredado vacío se omite sin afectar un grupo propio o heredado que sí tenga opciones.
- No se comparte el máximo entre grupos.
- No se permiten cantidades por opción ni más de una selección de la misma opción.
- La ausencia de precio base oculta el total, pero no impide consultar las adiciones.

## Accesibilidad

- Cada grupo usa `fieldset` y `legend` propios.
- Cada contador tiene `aria-live="polite"` independiente.
- Los checkboxes deshabilitados conservan etiqueta legible y estado nativo.
- La gestión de foco, cierre con `Esc` y devolución de foco del modal permanece intacta.

## Pruebas

La implementación debe demostrar:

1. Compatibilidad del Grupo 1 existente.
2. Schema completo del Grupo 2 en categoría e ítem.
3. Herencia, ocultamiento y reemplazo independientes para ambos grupos.
4. Máximo independiente de tres selecciones por grupo.
5. Suma de ambos grupos en el total.
6. Restablecimiento de ambos grupos al cerrar.
7. Omisión de grupos vacíos.
8. JavaScript, schema y plantilla válidos sin errores nuevos.

## Fuera de alcance

- Tercer grupo o número dinámico de grupos.
- Límite combinado entre grupos.
- Cantidades por adición.
- Dependencias entre opciones.
- Carrito, pedido o persistencia.
