# 🎀 Tienda Amanda - Documentación del Proyecto 🎀

Este documento sirve como "memoria" y manual técnico del proyecto. Si en el futuro necesitas que otra inteligencia artificial (o yo mismo en una nueva sesión) realice cambios o mejoras, **pídele que lea este archivo primero** para que entienda toda la arquitectura y no rompa nada.

## 📝 Resumen del Proyecto
Tienda Amanda es un catálogo en línea con fines pedagógicos y educativos. Su diseño sigue una estética "Kawaii" (colores pastel, bordes redondeados, tipografías amigables y modales animados). No hay pasarela de pago; las compras se coordinan redirigiendo al cliente a WhatsApp.

## 🏗️ Arquitectura y Tecnologías
- **Frontend:** Vanilla HTML, CSS y JavaScript (sin frameworks como React o Angular para mantenerlo simple y rápido).
- **Backend (Base de Datos):** Firebase (Google). Específicamente **Cloud Firestore** para los datos y **Firebase Auth** para el inicio de sesión del administrador.
- **Hosting:** Firebase Hosting.
- **Almacenamiento de Imágenes:** Las imágenes NO se suben a Firebase Storage. Para ahorrar costos y evitar subidas maliciosas, las imágenes se comprimen en el navegador y se guardan como cadenas de texto (`Base64`) directamente dentro del documento del producto en Firestore. (Firebase Storage está bloqueado por seguridad).

## 🗂️ Estructura de Archivos Principales
* `index.html`: La cara pública de la tienda. Muestra los productos, el pie de página con redes sociales y contiene la "Vista de Descanso" que oculta la tienda cuando está desactivada.
* `admin.html`: El panel de control oculto. Solo accesible con usuario y contraseña. Permite agregar/eliminar/editar productos, gestionar categorías y configurar la tienda (WhatsApp, Instagram, Horarios, Activar/Desactivar).
* `terminos.html`: Página de políticas y advertencias pedagógicas (protección al menor).
* `app.js`: Lógica del cliente (`index.html`). Lee productos en tiempo real, filtra por categorías y controla si la tienda está en modo descanso.
* `admin.js`: Lógica del administrador. Gestiona el inicio de sesión, el procesado de imágenes a Base64, el CRUD (crear, leer, actualizar, borrar) de productos y la configuración general.
* `modal.js`: Lógica para mostrar las alertas bonitas (Kawaii Modals) en toda la aplicación.
* `styles.css`: La hoja de estilos principal. Contiene variables de colores, animaciones (`floatZzz`) y estilos base.
* `firebase-config.js`: Las credenciales públicas de conexión a Firebase.
* `firestore.rules`: Las reglas de seguridad del backend.

## 🔒 Reglas de Seguridad (Firestore Rules)
La seguridad es estricta:
1. **Configuración (`config/info`):** Lectura pública (necesaria para saber si la tienda está activa). Escritura solo para administradores.
2. **Productos (`productos/{id}`):** Escritura solo para administradores. Lectura pública **SOLO SI** la tienda está activa (`storeActive == true`). Si la tienda se desactiva, Firestore bloquea las lecturas públicas.
3. **Storage:** Completamente denegado (`allow read, write: if false;`).

## 🚀 Despliegue (Deploy) a Producción
Para subir cambios a internet (`https://tienda-amanda-2026.web.app`), no es necesario modificar configuraciones complejas. Solo usa estos comandos en la terminal desde la carpeta del proyecto:

1. **Para subir la página web (HTML/CSS/JS):**
   ```bash
   npx -y firebase-tools@latest deploy --only hosting
   ```
2. **Para subir cambios en las reglas de seguridad (si se modifica firestore.rules):**
   ```bash
   npx -y firebase-tools@latest deploy --only firestore:rules
   ```

## 🎨 Guía de Estilos Visuales (Design System)
- **Fuente Principal:** Outfit (Google Fonts).
- **Paleta de Colores:**
  - Primario (Rosa): `#ff9a9e`
  - Secundario (Lila): `#a18cd1`
  - Acento (Celeste): `#fbc2eb`
  - Fondo (Crema/Blanco): `#fff0f5`
  - Texto oscuro: `#4a4a4a`
- **Modales:** Se debe usar la función `showModal(mensaje, tipo, titulo)` en lugar de los `alert()` nativos del navegador.
