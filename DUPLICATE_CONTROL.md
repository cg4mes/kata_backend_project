# Control de Duplicados en Proyectos

## 📋 Validaciones Implementadas

### 1. **Validación a Nivel de Código**
El servicio verifica antes de crear si ya existe un proyecto con:
- El mismo `product`, o
- El mismo `prefix`

### 2. **Validación a Nivel de Base de Datos**
Se agregaron índices únicos en la entidad:
```typescript
@Column({ unique: true })
@Index()
product: string;

@Column({ unique: true })
@Index()
prefix: string;
```

## 🔍 Comportamiento

### Endpoint: `POST /projects`

#### ✅ Caso Exitoso
```json
// Request
{
  "product": "Portal Web",
  "prefix": "PW",
  "totalDefinedTests": 150
}

// Response 201 Created
{
  "id": "uuid-123",
  "product": "Portal Web",
  "prefix": "PW",
  "totalDefinedTests": 150
}
```

#### ❌ Caso de Duplicado
```json
// Request (intentar crear el mismo proyecto)
{
  "product": "Portal Web",
  "prefix": "PW",
  "totalDefinedTests": 200
}

// Response 409 Conflict
{
  "statusCode": 409,
  "message": "Project with product \"Portal Web\" or prefix \"PW\" already exists",
  "error": "Conflict"
}
```

---

### Endpoint: `POST /projects/bulk`

#### ✅ Caso Exitoso
```json
// Request
{
  "teams": [
    {
      "product": "App Mobile",
      "prefix": "AM",
      "totalDefinedTests": 100
    },
    {
      "product": "Backend API",
      "prefix": "BA",
      "totalDefinedTests": 200
    }
  ]
}

// Response 201 Created
[
  {
    "id": "uuid-456",
    "product": "App Mobile",
    "prefix": "AM",
    "totalDefinedTests": 100
  },
  {
    "id": "uuid-789",
    "product": "Backend API",
    "prefix": "BA",
    "totalDefinedTests": 200
  }
]
```

#### ❌ Caso 1: Duplicados en la Petición
```json
// Request (dos proyectos con el mismo product)
{
  "teams": [
    {
      "product": "Dashboard",
      "prefix": "DS",
      "totalDefinedTests": 100
    },
    {
      "product": "Dashboard",  // ❌ Duplicado
      "prefix": "DS2",
      "totalDefinedTests": 200
    }
  ]
}

// Response 409 Conflict
{
  "statusCode": 409,
  "message": "Duplicate products or prefixes found in request",
  "error": "Conflict"
}
```

#### ❌ Caso 2: Proyecto Ya Existe en BD
```json
// Request (uno de los proyectos ya existe)
{
  "teams": [
    {
      "product": "Portal Web",  // ❌ Ya existe en BD
      "prefix": "PW",
      "totalDefinedTests": 100
    },
    {
      "product": "New Project",
      "prefix": "NP",
      "totalDefinedTests": 200
    }
  ]
}

// Response 409 Conflict
{
  "statusCode": 409,
  "message": "The following projects already exist: Portal Web (PW)",
  "error": "Conflict"
}
```

---

## 🛡️ Niveles de Protección

| Nivel | Descripción | Cuando se Activa |
|-------|-------------|------------------|
| **1. Validación DTO** | class-validator verifica tipos y formatos | Antes de llegar al servicio |
| **2. Validación Lógica** | El servicio busca duplicados en BD | En el método `create()` |
| **3. Índice Único** | La BD rechaza inserciones duplicadas | Si la validación falla |

---

## 📝 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| `201` | Proyecto creado exitosamente |
| `400` | Datos inválidos (validación DTO) |
| `409` | Conflicto: el proyecto ya existe |

---

## 🧪 Cómo Probarlo

### Usando cURL:

```bash
# 1. Crear un proyecto
curl -X POST http://localhost:3000/projects \
  -H "Content-Type: application/json" \
  -d '{
    "product": "Test Project",
    "prefix": "TP",
    "totalDefinedTests": 100
  }'

# 2. Intentar crear el mismo proyecto (debería devolver 409)
curl -X POST http://localhost:3000/projects \
  -H "Content-Type: application/json" \
  -d '{
    "product": "Test Project",
    "prefix": "TP",
    "totalDefinedTests": 150
  }'
```

### Usando Swagger UI:

1. Abre http://localhost:3000/api
2. Expande `POST /projects`
3. Haz clic en "Try it out"
4. Ingresa los datos y ejecuta dos veces
5. La segunda vez verás el error 409

---

## ✅ Ventajas de Esta Implementación

- ✅ **Prevención en Código**: Se valida antes de intentar guardar
- ✅ **Mensajes Claros**: El usuario sabe exactamente qué proyecto existe
- ✅ **Documentado**: Swagger muestra el error 409
- ✅ **Protección en BD**: Índices únicos como última línea de defensa
- ✅ **Bulk-Safe**: Valida duplicados dentro de la misma petición

---

## 🔧 Si Necesitas Modificar un Proyecto Existente

En lugar de crear uno nuevo, usa:
- `PUT /projects/:id` - Actualización completa
- `PATCH /projects/:id` - Actualización parcial
