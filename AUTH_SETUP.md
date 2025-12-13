# Sistema de Autenticación y Autorización

## 📋 Resumen

El sistema ahora cuenta con autenticación JWT y autorización basada en roles:

- **Admin**: Puede crear, editar y eliminar proyectos e indicadores
- **Viewer**: Solo puede visualizar datos (sin permisos de edición/eliminación)

Por defecto, todos los usuarios nuevos se crean como **Viewers**. Un administrador puede cambiar el rol de otros usuarios.

## 🚀 Configuración Inicial

### 1. Crear el Primer Usuario Admin

Puedes crear el primer usuario admin de dos formas:

#### Opción A: Usando Swagger UI

1. Inicia el backend: `npm run start:dev`
2. Accede a Swagger: `http://localhost:3000/api`
3. Ve al endpoint `POST /users/register`
4. Registra el primer usuario con rol admin:

```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```

#### Opción B: Usando cURL o Postman

```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### 2. Iniciar Sesión

Una vez creado el usuario admin:

1. Ve al frontend: `http://localhost:5173/login`
2. Ingresa las credenciales:
   - Email: `admin@example.com`
   - Password: `admin123`

## 🔐 Endpoints de Autenticación

### Registro de Usuario
```
POST /users/register
Body: { username, email, password, role? }
```

### Login
```
POST /users/login
Body: { email, password }
Response: { access_token, user }
```

### Obtener Todos los Usuarios (Solo Admin)
```
GET /users
Headers: Authorization: Bearer <token>
```

### Cambiar Rol de Usuario (Solo Admin)
```
PATCH /users/:id/role
Headers: Authorization: Bearer <token>
Body: { role: "admin" | "viewer" }
```

## 🛡️ Endpoints Protegidos

Los siguientes endpoints requieren autenticación y rol de Admin:

- `POST /projects` - Crear proyecto
- `PUT /projects/:id` - Actualizar proyecto
- `PATCH /projects/:id` - Actualizar proyecto parcialmente
- `DELETE /projects/:id` - Eliminar proyecto
- `DELETE /indicators/:id` - Eliminar indicador
- `DELETE /indicators/project/:projectId/all` - Eliminar todos los indicadores de un proyecto

## 🎨 Frontend

### Características Implementadas:

✅ **Página de Login** (`/login`)
- Formulario de autenticación
- Manejo de errores
- Diseño responsive y moderno

✅ **Contexto de Autenticación**
- Estado global del usuario y token
- Persistencia en localStorage
- Hook `useAuth()` para acceder al contexto

✅ **Rutas Protegidas**
- Redirige a login si no está autenticado
- Componente `ProtectedRoute`

✅ **Dashboard**
- Muestra información del usuario (nombre y rol)
- Botón de logout
- Botón "Nuevo Proyecto" solo visible para admins
- Botones "Editar" y "Eliminar" solo visibles para admins

✅ **Detalle de Proyecto**
- Botón "Eliminar Todos" solo visible para admins
- Botón "Eliminar" individual solo visible para admins
- Columna "Acciones" oculta para viewers

## 🔑 Gestión de Roles

### Para promover un Viewer a Admin:

1. Como admin, accede a Swagger o usa la API directamente
2. Usa el endpoint `PATCH /users/:id/role`
3. Envía el nuevo rol:

```json
{
  "role": "admin"
}
```

## 📝 Notas Importantes

- **JWT Secret**: En producción, configura `JWT_SECRET` en las variables de entorno
- **Token Expiration**: Los tokens expiran en 24 horas
- **Password Hashing**: Las contraseñas se hashean con bcrypt (salt rounds: 10)
- **Token Storage**: El token se almacena en localStorage en el frontend
- **API Interceptor**: Automáticamente agrega el token a todas las peticiones HTTP

## 🧪 Testing

### Crear Usuario de Prueba Viewer

```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "viewer1",
    "email": "viewer@example.com",
    "password": "viewer123"
  }'
```

Nota: Por defecto será creado como viewer (no es necesario especificar el rol).

## 🔄 Flujo de Usuario

1. **Primera vez**: Crear usuario admin manualmente
2. **Login**: Usuario ingresa credenciales → recibe token JWT
3. **Navegación**: Token se envía en headers de todas las peticiones
4. **Autorización**: Backend valida token y rol antes de ejecutar acciones
5. **Logout**: Token se elimina del localStorage

## 🆘 Troubleshooting

### Error: "Token inválido o expirado"
- El token expiró (24h)
- Vuelve a hacer login

### Error: "No tienes permisos"
- Estás intentando una acción de admin siendo viewer
- Contacta a un admin para cambiar tu rol

### No veo el botón "Nuevo Proyecto"
- Verifica que tu rol sea "admin"
- Revisa el badge debajo de tu nombre en el header
