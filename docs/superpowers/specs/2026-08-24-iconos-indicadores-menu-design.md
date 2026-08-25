# Iconos SVG para indicadores alimentarios

## Objetivo

Reemplazar los iconos genéricos actuales de los indicadores alimentarios del menú informativo por los seis SVG suministrados, manteniendo intactos la configuración, los textos y el comportamiento tanto en las tarjetas como en el modal.

## Correspondencia

- `mani.svg`: Contiene maní.
- `nueses.svg`: Contiene frutos secos.
- `gruten.svg`: Contiene gluten.
- `lateos.svg`: Contiene lácteos.
- `picante.svg`: Picante.
- `vegetariano.svg`: Vegetariano y Vegano.

Los nombres originales de los archivos se interpretan según su contenido y no se expondrán en la interfaz.

## Implementación

Los SVG se limpiarán antes de integrarlos: se eliminarán declaraciones XML, comentarios y metadatos de Adobe Illustrator, conservando únicamente el `viewBox` y la geometría visual necesaria. Los iconos se incluirán en línea desde `snippets/menu-dietary-indicators.liquid`, para que puedan heredar el color del indicador mediante `currentColor` y no requieran solicitudes adicionales.

El icono de vegetariano se reutilizará para el indicador Vegano, pero cada indicador conservará su etiqueta, `title` y texto accesible independiente.

## UI y accesibilidad

- Se conservarán las dimensiones y el espaciado existentes en tarjetas y modal.
- Los SVG decorativos tendrán `aria-hidden="true"`; el texto accesible seguirá describiendo cada indicador.
- El color continuará diferenciando advertencias alimentarias de atributos como vegetariano o vegano.
- No habrá cambios en los controles del editor de Shopify ni en los datos configurados.

## Validación

- Pruebas automatizadas comprobarán que cada indicador usa el SVG correspondiente y que Vegetariano/Vegano comparten el icono acordado.
- Se verificará que no permanezcan los iconos genéricos anteriores ni metadatos innecesarios.
- Se ejecutarán las pruebas del menú y Theme Check sobre el conjunto mínimo del tema.
