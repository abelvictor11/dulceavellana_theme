# Precio inicial e indicadores alimentarios

## Objetivo

Corregir el total estimado inicial del modal y añadir indicadores configurables para advertencias y atributos alimentarios, visibles en tarjetas y detalles.

## Precio estimado

El total inicial será siempre el precio base del ítem cuando no exista una presentación válida. Una presentación será válida únicamente si tiene nombre; un precio cero sin nombre no generará un control ni reemplazará el precio base.

Cuando existan presentaciones con nombre, la primera válida quedará seleccionada y su precio reemplazará el precio base. Las adiciones seleccionadas de ambos grupos se sumarán posteriormente. Al cerrar el modal se restaurará la primera presentación válida, se eliminarán las adiciones y se recalculará el total.

## Indicadores configurables

Cada ítem tendrá siete checkboxes independientes:

- Contiene maní.
- Contiene frutos secos.
- Contiene gluten.
- Contiene lácteos.
- Picante.
- Vegetariano.
- Vegano.

Los cinco primeros se presentarán como advertencias; vegetariano y vegano como atributos. Estos indicadores son informativos y no sustituyen información profesional sobre contaminación cruzada o alergias.

## Presentación visual

Cada indicador usará un SVG inline con `currentColor`, texto accesible y título descriptivo.

En la tarjeta se mostrará una fila compacta de iconos cerca del nombre. El texto completo estará disponible para lectores de pantalla y mediante tooltip. En el modal se mostrará una fila más explícita con icono y etiqueta visible.

Las advertencias usarán un tono cálido sutil; vegetariano y vegano usarán un tono verde sutil. El significado nunca dependerá solo del color, pues siempre habrá icono y etiqueta accesible.

Si ningún indicador está activo, no se renderizará el contenedor. Los iconos no serán enlaces ni controles interactivos.

## Accesibilidad y rendimiento

- SVG decorativo con `aria-hidden="true"`; el nombre aporta significado.
- Tooltips mediante atributo `title` y texto visualmente oculto en tarjeta.
- Etiquetas visibles dentro del modal.
- Sin dependencias, fuentes de iconos, imágenes adicionales ni JavaScript.

## Validación

1. Un ítem con precio base 11.500 y sin presentaciones abre con total 11.500.
2. Campos de presentación sin nombre no generan radios.
3. Primera presentación válida define el total inicial cuando existe.
4. Adiciones se suman sobre la base correcta.
5. Los siete indicadores pueden activarse independientemente.
6. Tarjeta y modal muestran únicamente indicadores activos.
7. Sin indicadores no queda espacio vacío.
8. Pruebas, JavaScript, schema y Theme Check permanecen sin errores nuevos.
