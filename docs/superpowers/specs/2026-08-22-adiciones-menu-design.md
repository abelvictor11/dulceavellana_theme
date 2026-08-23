# Adiciones y preparaciones del menú

## Objetivo

Extender el menú informativo con un simulador de personalización. El visitante podrá elegir una presentación y hasta el máximo permitido de adiciones para consultar el precio total, sin carrito, pedido ni persistencia de datos.

## Modelo de herencia

Cada categoría podrá definir un grupo predeterminado de adiciones compuesto por:

- Título del grupo, por ejemplo `Acompaña tus Huevos`.
- Texto de ayuda opcional.
- Mínimo seleccionable entre 0 y 8.
- Máximo seleccionable entre 1 y 8.
- Hasta ocho adiciones, cada una con nombre y precio adicional numérico en pesos colombianos.

Cada ítem tendrá un ajuste `Comportamiento de adiciones` con tres valores:

- `Heredar de la categoría`: usa el grupo de la categoría inmediatamente anterior.
- `Sin adiciones`: no muestra personalización aunque la categoría tenga un grupo.
- `Adiciones propias`: reemplaza el grupo heredado por el título, límites y hasta ocho opciones configuradas en el ítem.

La herencia se resolverá al renderizar, siguiendo el orden de bloques existente. Un ítem situado antes de la primera categoría no tendrá grupo heredado, pero podrá utilizar adiciones propias.

Solo existirá un grupo efectivo por producto. Las ocho opciones de ese grupo pueden representar extras o formas de preparación.

## Precios y presentaciones

Los valores usados para calcular serán números enteros en pesos colombianos, sin símbolos ni separadores. La interfaz los presentará mediante formato monetario `es-CO`, sin decimales.

El precio base actual del ítem y los precios de sus cuatro presentaciones se convertirán a campos numéricos. Si un ítem tiene presentaciones configuradas, el modal las mostrará como opciones seleccionables y la primera quedará elegida inicialmente. Su precio será la base del cálculo.

Si no existen presentaciones, el precio base del ítem será la base del cálculo. Un ítem sin ningún precio numérico podrá mostrar sus adiciones, pero el total se ocultará para evitar un cálculo engañoso.

El total se calculará únicamente en el navegador:

`precio de presentación o precio base + suma de adiciones seleccionadas`

El cierre y reapertura del modal restablecerán presentación y adiciones a sus valores iniciales.

## Interacción en el modal

Las presentaciones se mostrarán como un grupo de botones de opción. Cada fila incluirá nombre y precio, y toda la fila será seleccionable.

Las adiciones se mostrarán como checkboxes con nombre y precio precedido por `+`. El encabezado del grupo indicará la regla aplicable:

- Mínimo 0 y máximo 1: `Elige hasta 1`.
- Mínimo 0 y máximo mayor: `Elige hasta N`.
- Mínimo igual al máximo: `Elige N`.
- Otros casos: `Elige entre N y M`.

Un contador indicará el progreso, por ejemplo `1 de 2 seleccionadas`. Al alcanzar el máximo, las opciones no seleccionadas quedarán deshabilitadas; desmarcar una volverá a habilitarlas.

Como la experiencia no envía un pedido, el mínimo será informativo: no habrá botón de confirmación que bloquear. Mientras no se cumpla, el contador mostrará `Selecciona al menos N`.

El resumen de precio permanecerá visible al final del contenido del modal e incluirá `Total estimado` y el valor formateado. Un texto breve aclarará que el cálculo es informativo.

## Tarjeta

La tarjeta seguirá mostrando el precio base o `Desde` cuando existan presentaciones. No mostrará las adiciones para mantener su formato compacto. Podrá incluir una indicación corta `Personalizable` cuando el ítem tenga un grupo efectivo con al menos una adición válida.

## Configuración y validación

- Los límites se corregirán de forma defensiva en Liquid/JavaScript: mínimo nunca menor que 0, máximo nunca mayor que el número de opciones válidas y mínimo nunca mayor que máximo.
- Una adición sin nombre no se renderizará aunque tenga precio.
- Una adición sin precio se considerará de costo cero y se mostrará como `Sin costo`.
- Una presentación sin nombre no se renderizará.
- Los valores negativos no estarán permitidos por el schema.
- Si una categoría no tiene adiciones válidas, los productos que heredan se comportarán como productos sin adiciones.
- Cambiar de presentación no alterará las adiciones seleccionadas; solo recalculará el total.

## Accesibilidad

- Presentaciones agrupadas mediante `fieldset` y `legend`, con controles `radio` reales.
- Adiciones agrupadas mediante `fieldset` y `legend`, con `checkbox` reales.
- El contador y el total usarán una región `aria-live="polite"` para anunciar cambios sin interrumpir.
- Los estados deshabilitados conservarán contraste suficiente y no dependerán únicamente del color.
- La interacción conservará la gestión de foco y teclado ya definida para el modal.

## Pruebas

La extensión deberá demostrar:

1. Herencia del grupo de categoría y los modos `none` y `custom` por producto.
2. Selección de presentación y actualización del precio base.
3. Suma y resta de adiciones en el total.
4. Imposibilidad de superar el máximo y reactivación al desmarcar.
5. Mensajes correctos para las combinaciones de mínimo y máximo.
6. Restablecimiento completo al cerrar y reabrir el modal.
7. Ausencia de carrito, pedidos o persistencia.
8. Schema y plantilla JSON válidos, sin errores nuevos de Theme Check en los archivos modificados.

## Fuera de alcance

- Varios grupos simultáneos para un mismo producto.
- Cantidades mayores a una por adición.
- Dependencias condicionales entre adiciones.
- Envío de la selección, carrito, pedidos o pagos.
- Conversión de moneda o precios con centavos.
