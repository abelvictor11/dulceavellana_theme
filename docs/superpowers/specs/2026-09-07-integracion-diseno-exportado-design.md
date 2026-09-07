# Integración selectiva del diseño exportado

## Objetivo

Nivelar el frontend del repositorio con la exportación ubicada en `/Users/usuario/Downloads/dulceavellana`, tratándola como autoridad para diseño y contenido, sin sobrescribir las funcionalidades personalizadas desarrolladas en el repositorio.

El trabajo se realizará en la rama `staging`, creada desde el `main` local. Ese punto de partida incluye las mejoras de menú e iconos que todavía están por delante de `origin/main`.

## Principio de integración

La exportación será autoridad para configuración visual, contenido editorial y composición de plantillas. El repositorio será autoridad para código funcional, estructura semántica y desarrollos personalizados.

No se copiará el árbol completo. Cada incorporación deberá pertenecer a la lista permitida de esta especificación.

## Archivos que se importarán desde la exportación

### Configuración y contenido existente

- `config/settings_data.json`
- `templates/collection.json`
- `templates/index.json`
- `templates/page.contact.json`
- `templates/password.json`
- `templates/product.json`

Estos archivos incorporan, entre otros cambios, la tipografía Quicksand, tamaño de texto base de 15 px, encabezado transparente, navegación actualizada, nuevo anuncio, contenido de footer, nueva portada, ajustes de colección y recomendaciones de producto.

### Plantillas nuevas

- `templates/collection.nueva-plantilla-de-colecc.json`
- `templates/collection.temporada-inactiva.json`
- `templates/page.bodas-y-eventos-nueva.json`
- `templates/page.fechas-especiales.json`
- `templates/page.mesas-de-experiencia.json`
- `templates/page.regalos-corporativos.json`
- `templates/page.tortas-y-postres-para-15.json`
- `templates/page.tortas-y-postres-para-bodas.json`

Las referencias a recursos de Shopify —imágenes, colecciones, menús, páginas y bloques de aplicaciones— se conservarán literalmente. Si una referencia no existe en la tienda destino, se reportará y no se sustituirá por contenido inventado.

### Rendimiento y footer

- Añadir `assets/tiny-img-link-preloader.js` desde la exportación.
- Añadir en `layout/theme.liquid` la carga diferida de `tiny-img-link-preloader.js`, inmediatamente antes de `</body>`.
- Eliminar de `sections/footer.liquid` la línea visible “Powered By Oderway”.

## Cambios que no se importarán

No se copiarán los siguientes cambios de la exportación:

- `sections/header.liquid`: reemplazo del `<h1>` del logo de inicio por un `<div>`.
- `sections/image-with-text-overlay.liquid`: reemplazo indiscriminado de `<h2>` por `<h1>`.
- `snippets/product-meta.liquid`: reemplazo del título principal del producto de `<h1>` a `<h2>`.

La combinación exportada puede dejar páginas de producto sin encabezado principal y crear múltiples `<h1>` en otras páginas. Se mantendrá la estructura semántica actual del repositorio.

Tampoco se copiarán archivos idénticos, archivos de control de versiones ni ninguna eliminación implícita por ausencia en la exportación.

## Funcionalidades protegidas

Los siguientes archivos deben conservar su contenido exacto durante la integración:

- `sections/menu-list.liquid`
- `snippets/menu-dietary-indicators.liquid`
- `templates/page.menu.json`
- `tests/menu-informational.test.mjs`
- `docs/superpowers/`

No se eliminarán otras plantillas existentes en el repositorio.

## Flujo de integración

1. Registrar hashes de los cuatro archivos funcionales del menú antes de los cambios.
2. Incorporar solo los archivos de la lista permitida.
3. Validar sintaxis de todos los JSON modificados y nuevos.
4. Comprobar que cada tipo de sección usado por las plantillas exista en `sections/` o corresponda al tipo especial `apps`.
5. Confirmar que los hashes de los archivos funcionales del menú no cambiaron.
6. Ejecutar las pruebas automatizadas del menú y Shopify Theme Check.
7. Revisar el diff completo y clasificar cualquier referencia de Shopify que no pueda verificarse localmente.
8. Publicar `staging` y crear un Pull Request sin desplegar el tema.

## Validación y criterios de aceptación

- Los archivos JSON procesan correctamente con `jq`.
- Las nuevas plantillas están presentes y sus tipos de sección tienen implementación local.
- Las 13 pruebas de `tests/menu-informational.test.mjs` continúan aprobando.
- Theme Check no introduce errores nuevos atribuibles a esta integración.
- Los cuatro archivos funcionales del menú permanecen idénticos.
- El diff contiene únicamente los archivos permitidos, la especificación y el futuro plan de implementación.
- La rama `staging` queda disponible para revisión mediante Pull Request; no se realiza publicación automática en Shopify.

## Riesgos conocidos

- Los identificadores `shopify://` dependen de recursos existentes en la tienda y no pueden comprobarse completamente desde el tema local.
- Algunos bloques `apps` dependen de aplicaciones instaladas y activas en la tienda.
- El nuevo menú de navegación `nav-menu-d-a-del-padre` y los handles de colecciones de la portada deben existir en la tienda para renderizar el contenido esperado.
- El preloader añade solicitudes anticipadas al pasar el cursor o tocar enlaces; excluye las rutas del carrito y respeta el modo de ahorro de datos.
