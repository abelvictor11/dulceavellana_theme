# Scroll independiente del modal en escritorio

## Objetivo

Mantener la galería visible mientras el visitante recorre presentaciones y adiciones largas en escritorio, sin modificar la experiencia móvil actual.

## Comportamiento

A partir de 701 px, el panel del modal tendrá una altura máxima basada en el viewport y ocultará su desbordamiento. La cuadrícula de dos columnas ocupará toda esa altura:

- La galería izquierda permanecerá fija y no tendrá scroll vertical.
- La columna de contenido derecha será la única región desplazable.
- El botón de cierre permanecerá visible sobre el panel.
- El total estimado continuará al final del contenido desplazable.

La columna derecha mostrará una barra de scroll nativa discreta y conservará espacio suficiente para que no cubra textos ni precios. Un borde o sombra interior sutil comunicará la separación entre galería y contenido.

Hasta 700 px se conservará el comportamiento existente: diseño de una columna, panel completo con scroll vertical, galería seguida del contenido y modal alineado al borde inferior.

## Estados especiales

- Si el contenido derecho es corto, no aparecerá una barra innecesaria.
- Si la ventana tiene poca altura, el panel respetará el margen exterior y el contenido seguirá siendo accesible.
- La galería no crecerá más allá del alto disponible; su imagen usará `object-fit: cover` y dimensiones contenidas.
- Las miniaturas permanecerán visibles bajo la imagen cuando quepan; su fila podrá conservar scroll horizontal.
- El bloqueo de scroll de la página, foco y cierre del modal no cambiarán.

## Validación

1. A 1280 px, solo la columna derecha se desplaza.
2. Imagen, miniaturas y botón cerrar permanecen visibles durante el scroll.
3. A 701 px se mantiene la estructura de dos columnas sin desbordamiento horizontal.
4. A 700 px y 375 px se conserva el scroll completo actual.
5. No se introduce JavaScript nuevo ni se altera el cálculo de precios.
6. Theme Check y las pruebas existentes permanecen sin errores.
