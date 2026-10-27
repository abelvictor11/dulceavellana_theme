# Menú informativo distribuido en grupos de secciones

## Intención

Evitar el límite de 512 KB de `templates/page.menu.json` sin rediseñar el menú público ni sacar su administración del editor visual de Shopify. La solución debe conservar categorías, tarjetas, ítems simples, modales, imágenes, tamaños, indicadores alimentarios y los tres grupos de adiciones.

## Estado actual

- `page.menu.json` contiene una instancia de `menu-list` y todos sus bloques.
- Un bloque `item` expone 118 ajustes; al crecer el catálogo, el contenido guardado en la plantilla supera 512 KB.
- Dividir el contenido en varias secciones dentro de la misma plantilla no sirve: Shopify aplica el límite al archivo JSON completo.
- Shopify permite grupos de secciones personalizados, editables desde el editor, y cada archivo de grupo tiene su propio límite de 512 KB.

## Objetivos

- Mantener sin cambios perceptibles la UI pública del menú.
- Mantener toda la edición de contenido dentro del editor visual de Shopify.
- Repartir el almacenamiento en archivos independientes con margen suficiente de crecimiento.
- Preservar los datos existentes mediante una migración determinista y verificable.
- Mantener una sola navegación de categorías y una experiencia continua aunque internamente existan varios grupos.

## No objetivos

- No usar productos, colecciones, metaobjetos ni aplicaciones externas como fuente del menú.
- No rediseñar tarjetas, modal, filtros, navegación o comportamiento responsive.
- No cambiar la lógica de precios estimados, restricciones alimentarias o límites de adiciones.
- No mezclar este cambio con la PR #11; esta rama se integrará después de que ese ajuste esté disponible en `main` o se actualizará sobre él antes de abrir la PR.

## Enfoques considerados

### 1. Grupos de secciones personalizados — elegido

Crear varios archivos `sections/menu-content-*.json`, cada uno con una instancia de la sección del menú y un límite independiente de 512 KB. El layout principal los renderiza únicamente para `page.menu`. En el editor seguirán apareciendo como áreas editables del mismo menú.

Ventajas: conserva todos los tipos de bloque y ajustes actuales, multiplica la capacidad y requiere pocos cambios en el flujo editorial. Desventajas: la implementación debe coordinar varias instancias para que visualmente se comporten como una sola.

### 2. Aligerar el esquema y reutilizar grupos de adiciones

Reducir los 118 ajustes de cada plato y mover las adiciones a bloques compartidos. Consume menos espacio, pero cambia de manera importante cómo el cliente configura cada producto y no elimina el límite futuro de la plantilla.

### 3. Solución híbrida

Combinar grupos independientes con un esquema más compacto. Ofrece la mayor capacidad, pero introduce una migración y un cambio editorial mayores de los necesarios para resolver el problema actual.

## Arquitectura elegida

### Almacenamiento

- `templates/page.menu.json` queda liviano y conserva solo la estructura mínima de la página.
- Se crean inicialmente cuatro grupos personalizados, cada uno con tipo `custom.menu_content` y un nombre claro en el editor:
  - `sections/menu-content-1.json`
  - `sections/menu-content-2.json`
  - `sections/menu-content-3.json`
  - `sections/menu-content-4.json`
- Cada grupo comienza con una instancia de la sección de contenido del menú y conserva margen operativo; la migración no llenará ningún archivo por encima de aproximadamente 350 KB.
- Los bloques se distribuyen por categorías completas. Una categoría y todos sus platos permanecen en el mismo grupo para conservar la herencia de adiciones.

### Renderizado

- `layout/theme.liquid` renderiza los cuatro grupos solamente cuando la plantilla sea `page.menu`.
- La sección mantiene el marcado de tarjetas y modales existente.
- La primera instancia actúa como coordinadora visual; las siguientes se presentan como continuaciones, sin repetir encabezado, navegación ni espacios exteriores.
- Un controlador común reúne las categorías de todas las instancias y construye una sola navegación.
- Los identificadores de categorías, diálogos y controles incorporan el ID de su sección para evitar colisiones entre grupos.
- La selección y actualización en el editor se mantiene compatible con los eventos de Shopify (`shopify:section:load`, selección y reordenamiento).

### Configuración editorial

- El comerciante seguirá abriendo la plantilla Menu en el editor visual.
- Verá áreas de contenido consecutivas, nombradas como partes del menú, pero el preview mostrará un solo menú continuo.
- Podrá seguir agregando los mismos bloques `category`, `item` e `item_simple`.
- Una categoría no debe repartirse manualmente entre dos áreas. Los nombres del editor y la documentación breve harán explícita esta regla.

## Migración de contenido existente

1. Descargar una copia del tema y del último `page.menu.json` guardado en Shopify.
2. Guardar un respaldo sin modificar.
3. Ejecutar un script del repositorio que lea la sección actual, agrupe cada categoría con sus platos y reparta esos conjuntos entre los cuatro archivos sin superar el umbral de seguridad.
4. Conservar los IDs, tipos, ajustes, imágenes, textos, precios y orden de los bloques.
5. Copiar los ajustes visuales de la sección principal a las instancias nuevas; solo la primera queda marcada como coordinadora.
6. Validar que el conteo y una huella estable de los bloques antes y después coincidan.
7. Subir a un tema de prueba y aprobarlo visualmente antes de reemplazar la plantilla activa.

Si el archivo remoto no puede obtenerse automáticamente, el proceso se detiene y solicita una exportación del tema; nunca se recreará el contenido manualmente ni se sobrescribirá sin respaldo.

## Compatibilidad y fallos seguros

- Si un grupo está vacío, no genera espacio ni navegación duplicada.
- Si JavaScript no carga, las categorías y platos siguen visibles en orden; únicamente se degrada la navegación unificada.
- El código conserva soporte móvil y desktop actual.
- Se añade una comprobación automatizada para que cada JSON permanezca por debajo de 512 KB y una advertencia preventiva al acercarse al umbral interno.

## Verificación

- Pruebas unitarias de distribución, integridad, orden y límites de tamaño.
- Suite existente completa.
- `shopify theme check` y validación JSON de plantilla y grupos.
- Comparación visual del menú antes/después en desktop y móvil.
- Prueba en el editor: agregar, mover, modificar y eliminar categorías, platos e ítems simples en cada grupo.
- Prueba de navegación, apertura/cierre de modales, galerías, adiciones, total estimado e indicadores alimentarios a través de límites de grupo.

## Riesgos y mitigaciones

- **Datos remotos no disponibles:** exigir exportación o acceso al tema antes de migrar.
- **Categoría partida:** el migrador particiona únicamente en fronteras de categoría y las pruebas lo verifican.
- **IDs duplicados:** todos los selectores públicos se califican con el ID de sección.
- **Editor menos intuitivo:** nombres secuenciales, textos de ayuda y grupos vacíos sin impacto visual.
- **Crecimiento futuro:** cuatro archivos proporcionan capacidad amplia; la prueba de tamaño detectará el límite antes del despliegue.

## Criterios de aceptación

- El menú público es visual y funcionalmente equivalente al actual.
- Todo el contenido continúa editable desde el editor de Shopify.
- `page.menu.json` y cada grupo permanecen por debajo de 512 KB.
- Ningún dato existente se pierde ni cambia de orden durante la migración.
- La PR contiene respaldo lógico mediante script y pruebas, no una edición manual irreversible de los datos.
