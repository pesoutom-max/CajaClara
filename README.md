# CajaClara - FacilPyme

CajaClara es un libro de caja digital diseñado para pequeñas empresas chilenas, parte de la familia de productos FacilPyme.

## Tecnologías
- Next.js 14 (App Router)
- Firebase (Auth, Firestore)
- Tailwind CSS
- Recharts, SheetJS, jsPDF

## Configuración del Proyecto y Firebase

### 1. Crear el Proyecto en Firebase
1. Ve a la consola de [Firebase](https://console.firebase.google.com/).
2. Crea un nuevo proyecto llamado `CajaClara`.
3. Activa **Authentication** y habilita el método de inicio de sesión por **Correo electrónico / Contraseña**.
4. Activa **Firestore Database** en modo producción y configura tus reglas. Copia y pega el contenido del archivo `firestore.rules` provisto en este repositorio.
5. Registra una aplicación "Web" en tu proyecto de Firebase para obtener las credenciales.

### 2. Configurar Entorno Local
1. Copia el archivo `.env.local.example` y renómbralo a `.env.local`.
2. Completa las variables con las credenciales que obtuviste en el paso anterior:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="tu_api_key_aqui"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tu_proyecto.firebaseapp.com"
   ...
   ```
3. Instala las dependencias si no lo has hecho: `npm install`
4. Inicia el servidor de desarrollo: `npm run dev`

### 3. Crear el Primer Administrador
Por defecto, todo usuario que se registra usando la pantalla de login obtiene el rol de "user" (no tiene acceso al panel de administración).

Para convertir el primer usuario a Administrador:
1. Inicia la aplicación y regístrate normalmente con un nuevo usuario desde `/login`.
2. Ve a la consola de Firebase -> **Firestore Database**.
3. Busca la colección `users` y localiza el documento recién creado (busca por el correo electrónico en el campo `email`).
4. Edita el campo `role` de ese documento y cambia el valor `"user"` por `"admin"`.
5. Recarga la aplicación web para que el nuevo rol haga efecto en tu sesión activa.
6. Ahora este usuario tendrá acceso a la ruta `/admin` y podrá ver todos los usuarios, pero no podrá acceder a las finanzas (subcolección `transactions`) de los demás.

## Scripts Adicionales
- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Compila la aplicación para producción.
- `npm run lint`: Ejecuta el linter.
