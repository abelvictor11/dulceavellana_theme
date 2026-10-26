# Vista de lista para el bloque ítem simple

## Intención

Reducir la altura visual del bloque `item_simple` del “Menú informativo”, para que se lea como una lista compacta y no como una tarjeta completa sin imagen.

## Alcance aprobado

- Solo el bloque `item_simple` activa la variante `MenuItem--simple`.
- La fila ocupa el ancho completo del grid y elimina la altura mínima reservada para tarjetas.
- Conserva nombre, etiqueta, descripción breve y precio cuando existan.
- El bloque sigue siendo informativo y no abre modal.
- Los bloques `item` conservan exactamente su tarjeta y modal actuales.
- En móvil la fila permanece compacta.

## Alternativas consideradas

- **Ajustar el bloque `item_simple` existente — elegida:** resuelve el problema sin cambiar datos ni configuración.
- **Convertir cualquier ítem sin imagen en lista:** descartada porque `item` puede ocultar su imagen y conservar configuraciones avanzadas.
- **Selector manual de vista:** descartada porque añade complejidad innecesaria al editor.

## No objetivos

- No rediseñar el modal.
- No modificar categorías, adiciones, precios ni indicadores.
- No alterar la estructura de datos del template.

## Verificación

- Prueba estructural para las reglas compactas del bloque `item_simple`.
- Suite existente del menú.
- Validación Shopify Liquid y Theme Check.
- Revisión visual en escritorio y móvil cuando exista una vista previa accesible.
