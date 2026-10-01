# BRAAMOD — cambios aplicados

Copia estos archivos sobre tu proyecto (la carpeta .git NO va en este zip; tu repo sigue igual).

## Qué cambió
- Filtros "Precio bajo/alto" eliminados (todo cuesta $90.000).
- 2 productos sin nombre ahora tienen uno provisional: "Maahir (versión oscura)" y "Orientica (ámbar dorado)". Cámbialos en productos.js si el nombre real es otro.
- Carrito: cantidades (+/−), sin líneas repetidas, total en formato es-CO, no falla si localStorage está bloqueado, nombres escapados.
- Botón "Solicitar pago por Nequi": ahora dice lo que hace (pide los datos de pago por WhatsApp).
- Buscador ignora tildes (olympea = Olympéa).
- JavaScript separado: productos.js (catálogo) y app.js (lógica). Número de WhatsApp en una sola constante (WA_NUMERO).
- Imágenes de producto en WebP (8,5 MB -> ~2,2 MB). Se quitaron 5 fotos sin usar; siguen en tu repo/zip original.
- Productos visibles aunque falle JavaScript; lista de productos en <noscript>.
- Pantalla de carga: 1,2 s y solo la primera vez por sesión.
- SEO: canonical, og:type/locale, Twitter Card, og:image absoluto, datos de la organización, robots.txt y sitemap.xml.
- Botón flotante de WhatsApp.
- Accesibilidad: modales con role="dialog", foco atrapado y devuelto, categorías con aria-pressed, scroll solo si hace falta.
- .gitignore en UTF-8.

## Pendiente (necesito tus datos)
- Envíos, métodos de pago y devoluciones.
- Tamaño (ml) de los perfumes a $90.000 y notas olfativas.
- Aviso "inspirado en" para las marcas (consúltalo con un abogado).
- Pago real con Nequi/Wompi/Bold, analítica y precios como números.
