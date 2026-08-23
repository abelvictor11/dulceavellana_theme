# Menú informativo configurable

## Objetivo

Reemplazar la sección actual de la plantilla `page.menu`, basada en productos, colecciones, variantes y carrito de Shopify, por una carta de restaurante exclusivamente informativa. Todo el contenido se administrará desde la propia sección en el editor del tema, sin crear productos ni colecciones.

## Modelo de contenido

La sección usará bloques secuenciales de dos tipos:

- **Categoría:** inicia un grupo visual y define su nombre y descripción opcional.
- **Ítem del menú:** pertenece a la categoría situada inmediatamente antes en el orden de bloques.

El editor podrá reordenar categorías e ítems mediante el orden normal de bloques de Shopify. Si un ítem aparece antes de la primera categoría, se mostrará bajo una categoría general cuyo nombre será configurable en la sección.

Cada ítem permitirá configurar:

- Nombre.
- Imagen principal.
- Resumen corto para la tarjeta.
- Descripción amplia para el modal.
- Precio base.
- Hasta cuatro opciones manuales de tamaño o presentación, cada una con nombre y precio.
- Hasta tres imágenes adicionales para la galería del modal.
- Etiqueta opcional, por ejemplo “Favorito”, “Nuevo” o “Vegano”.

Los precios serán campos de texto para permitir formatos naturales de carta como `$12.000`, `Según tamaño` o `Precio por libra`. Cuando existan opciones, la tarjeta mostrará `Desde` seguido del precio base; cuando no existan, mostrará únicamente el precio base.

## Experiencia de navegación

El encabezado conservará antetítulo, título, descripción y alineación configurables.

Una barra horizontal de categorías permitirá navegar por la carta. Podrá permanecer fija al desplazarse y realizará scroll suave hacia la categoría elegida. En pantallas pequeñas tendrá desplazamiento horizontal sin romper el ancho de la página. El estado activo se actualizará al seleccionar una categoría.

Las categorías se mostrarán en una sola página para facilitar el recorrido y la consulta rápida. Cada una tendrá título, descripción opcional y una cuadrícula de ítems.

## Tarjetas

En escritorio se usarán dos columnas por defecto, con opción de dos o tres columnas. En móvil se usará una columna. Las tarjetas serán compactas y horizontales:

- Imagen cuadrada a la izquierda.
- Etiqueta opcional, nombre y resumen en el centro.
- Precio y botón `Ver detalles` claramente visibles.

La tarjeta completa será interactiva para abrir el modal, manteniendo un botón explícito para que la acción sea evidente. Tendrá estados de foco y hover coherentes con el tema. Cuando no haya imagen, se mostrará un marcador visual neutro sin dejar espacios rotos.

## Modal de detalle

Cada ítem generará su contenido de detalle dentro de la sección. Solo habrá un modal visible a la vez. El modal incluirá:

- Imagen principal y miniaturas de las imágenes adicionales.
- Nombre, etiqueta y precio base.
- Descripción completa con formato enriquecido.
- Lista de tamaños o presentaciones con sus precios.

La galería cambiará la imagen principal al seleccionar una miniatura. El modal se cerrará con el botón visible, con `Esc` o al pulsar fuera del panel. Al abrirse bloqueará el scroll del documento, moverá el foco al modal y recordará el elemento que lo abrió para devolverle el foco al cerrar.

En móvil el modal ocupará casi toda la pantalla y permitirá desplazamiento interno. En escritorio se presentará como un panel centrado de ancho controlado, con galería y contenido en dos columnas cuando haya espacio.

## Configuración visual de la sección

La sección expondrá controles para:

- Textos del encabezado y alineación.
- Mostrar u ocultar la navegación de categorías.
- Activar o desactivar su comportamiento fijo.
- Número de columnas en escritorio.
- Tamaño de la imagen de la tarjeta.
- Radio de las tarjetas y del modal.
- Texto del botón de detalle y prefijo `Desde`.
- Color de acento y color del texto sobre el acento, con valores heredados del tema cuando no se definan.
- Nombre de la categoría general usada para ítems huérfanos.

La implementación respetará las tipografías, colores base, espaciado y variables CSS existentes en el tema para integrarse con la identidad de Dulce Avellana.

## Estados especiales

- Sin bloques: se mostrará un mensaje solo en el editor de Shopify indicando cómo agregar contenido; la tienda no mostrará una sección vacía prominente.
- Categoría sin ítems: su encabezado no se renderizará en la tienda.
- Ítem sin nombre: se omitirá en la tienda y conservará sus controles en el editor.
- Ítem sin descripción amplia ni opciones: el modal mostrará la información disponible sin secciones vacías.
- JavaScript desactivado: las tarjetas y la información esencial permanecerán visibles; el detalle ampliado dependerá del modal interactivo.

## Accesibilidad y rendimiento

- Botones reales para acciones y etiquetas ARIA descriptivas.
- Modal con `role="dialog"`, `aria-modal="true"` y título asociado.
- Gestión de foco, cierre con teclado y estados de foco visibles.
- Imágenes responsivas mediante `image_url`, `srcset`, dimensiones explícitas y carga diferida.
- JavaScript aislado por `section.id`, compatible con varias instancias y con recargas del editor del tema.
- Sin peticiones al carrito, dependencias externas ni consultas al catálogo.

## Validación

La implementación se considerará correcta cuando:

1. La plantilla no lea colecciones, productos, variantes ni rutas de carrito.
2. Categorías e ítems puedan crearse y reordenarse íntegramente desde la sección.
3. Las tarjetas funcionen correctamente en una, dos y tres columnas según el ancho configurado.
4. Cada modal muestre únicamente los datos del ítem elegido y permita recorrer su galería.
5. Apertura, cierre, bloqueo de scroll y devolución de foco funcionen con mouse y teclado.
6. No existan errores de sintaxis en el schema JSON ni en la plantilla JSON.
7. La sección responda correctamente a los eventos de carga y descarga del editor de Shopify.

## Alcance excluido

- Carrito, pedidos, reservas y pagos.
- Sincronización con productos, colecciones o inventario de Shopify.
- Buscador, filtros por atributos o alérgenos.
- Carga de contenido desde servicios externos.
- Metaobjetos o aplicaciones privadas.
