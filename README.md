# Proyecto 1 - API de videojuegos

API REST hecha con Node.js, Express y MongoDB Atlas para gestionar videojuegos y usuarios. Los usuarios se registran con una imagen (que se sube a Cloudinary), tienen un rol (`user` o `admin`) y pueden guardar juegos favoritos.

## Tecnologías

- Node.js (CommonJS)
- Express 5
- MongoDB Atlas y Mongoose 8
- bcrypt (encriptar contraseñas)
- jsonwebtoken (autenticación con token)
- multer, cloudinary y multer-storage-cloudinary (subida de imágenes)
- dotenv y nodemon

## Instalación y puesta en marcha

1. Instalar las dependencias:

```bash
npm install
```

2. Rellenar el archivo `.env` con tus datos (ver el apartado siguiente).
3. Cargar los juegos de ejemplo en la base de datos:

```bash
npm run seed
```

4. Arrancar el servidor:

```bash
npm run dev
```

El servidor queda en `http://localhost:3000`. Con `npm start` se arranca sin nodemon.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DB_URL` | URL de conexión de MongoDB Atlas |
| `JWT_SECRET` | Frase secreta para firmar los tokens |
| `CLOUDINARY_CLOUD_NAME` | Nombre de la cuenta de Cloudinary |
| `CLOUDINARY_API_KEY` | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary |

## Modelos

### Game (colección `games`)

| Campo | Tipo | Reglas |
|---|---|---|
| `title` | String | obligatorio |
| `genre` | String | obligatorio. Acción, Aventura, RPG, Deportes, Estrategia, Shooter o Plataformas |
| `platform` | String | obligatorio. PC, PlayStation, Xbox, Nintendo o Multiplataforma |
| `year` | Number | entre 1970 y 2100 |
| `rating` | Number | entre 0 y 10, por defecto 5 |

### User (colección `users`)

| Campo | Tipo | Reglas |
|---|---|---|
| `name` | String | obligatorio |
| `email` | String | obligatorio y único |
| `password` | String | obligatorio, mínimo 8 caracteres (se guarda encriptada) |
| `role` | String | `user` o `admin`, por defecto `user` |
| `image` | String | URL de la imagen en Cloudinary |
| `imageId` | String | public_id de la imagen en Cloudinary (para poder borrarla) |
| `favoriteGames` | Array de ObjectId | referencia a `Game` |

## Roles y permisos

| Acción | Sin login | user | admin |
|---|---|---|---|
| Ver juegos | Sí | Sí | Sí |
| Crear, editar y borrar juegos | No | No | Sí |
| Registrarse y hacer login | Sí | Sí | Sí |
| Ver la lista de todos los usuarios | No | No | Sí |
| Ver un usuario por id | No | Sí | Sí |
| Editar su propio usuario | No | Sí | Sí |
| Editar otro usuario | No | No | Sí |
| Cambiar el rol de un usuario | No | No | Sí |
| Añadir o quitar favoritos propios | No | Sí | Sí |
| Añadir o quitar favoritos de otro | No | No | Sí |
| Borrar su propia cuenta | No | Sí | Sí |
| Borrar la cuenta de otro | No | No | Sí |

Los usuarios nuevos siempre se crean con rol `user`, aunque en el body se envíe otro rol.

## Endpoints

### Games (`/api/games`)

| Método | Ruta | Protección | Descripción |
|---|---|---|---|
| GET | `/api/games` | pública | Todos los juegos |
| GET | `/api/games/:id` | pública | Un juego por id |
| POST | `/api/games` | admin | Crear un juego |
| PUT | `/api/games/:id` | admin | Actualizar un juego |
| DELETE | `/api/games/:id` | admin | Borrar un juego |

Ejemplo de body para crear o actualizar un juego:

```json
{
  "title": "The Legend of Zelda: Breath of the Wild",
  "genre": "Aventura",
  "platform": "Nintendo",
  "year": 2017,
  "rating": 9.8
}
```

### Users (`/api/users`)

| Método | Ruta | Protección | Descripción |
|---|---|---|---|
| POST | `/api/users/register` | pública | Registro con imagen (Multipart Form) |
| POST | `/api/users/login` | pública | Login, devuelve `token` y `user` |
| GET | `/api/users` | admin | Todos los usuarios con sus juegos favoritos |
| GET | `/api/users/:id` | usuario logueado | Un usuario con sus juegos favoritos |
| PUT | `/api/users/:id` | el propio usuario o admin | Actualizar datos (Multipart Form, imagen opcional) |
| PUT | `/api/users/:id/role` | admin | Cambiar el rol |
| PUT | `/api/users/:id/favorites` | el propio usuario o admin | Añadir favoritos |
| DELETE | `/api/users/:id/favorites/:gameId` | el propio usuario o admin | Quitar un favorito |
| DELETE | `/api/users/:id` | el propio usuario o admin | Borrar la cuenta y su imagen |

Ejemplos de body:

Registro (Multipart Form):

```
name: Ana
email: ana@correo.com
password: 12345678
image: (archivo)
```

Login (JSON):

```json
{
  "email": "ana@correo.com",
  "password": "12345678"
}
```

Cambiar rol (JSON):

```json
{
  "role": "admin"
}
```

Añadir favoritos (JSON). Los juegos nuevos se añaden a los que ya había, sin duplicados:

```json
{
  "favoriteGames": ["id_del_juego_1", "id_del_juego_2"]
}
```

## Cómo mandar el token

Después del login, en las rutas protegidas se envía la cabecera:

```
Authorization: Bearer <token>
```

## Cómo crear el primer admin

1. Registrar un usuario con `POST /api/users/register`.
2. Entrar en MongoDB Atlas: Browse Collections, colección `users`.
3. Editar el documento del usuario y cambiar el campo `role` a `admin`.
4. Hacer login de nuevo con ese usuario.

A partir de ahí, ese admin puede cambiar el rol de otros usuarios con `PUT /api/users/:id/role`.

## Cómo probar la subida de imagen en Insomnia

1. Crear una petición `POST` a `http://localhost:3000/api/users/register`.
2. En Body elegir **Multipart Form**.
3. Añadir los campos de texto `name`, `email` y `password`.
4. Añadir un campo llamado `image`, cambiarlo a tipo **File** y elegir una imagen del equipo.

## Nota sobre la seed

La seed borra la colección de juegos y la vuelve a crear, así que los ids de los juegos cambian. Hay que ejecutar `npm run seed` antes de añadir juegos a favoritos. Si se vuelve a ejecutar, los favoritos de los usuarios apuntarán a ids que ya no existen.

## Estructura del proyecto

```
.env
.gitignore
index.js
package.json
README.md
src/
├─ config/        db.js, cloudinary.js
├─ data/          games.js
├─ models/        game.model.js, user.model.js
├─ controllers/   games.controllers.js, users.controllers.js
├─ routes/        games.routes.js, users.routes.js
├─ middlewares/   auth.middleware.js, file.js
└─ utils/         token.js, cloudinary.util.js, seeds/games.seed.js
```
