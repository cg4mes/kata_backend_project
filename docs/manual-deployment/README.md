# Manual Deployment Scripts

Esta carpeta contiene scripts para **deployment manual** como alternativa a los workflows automatizados de GitHub Actions.

## ⚠️ Nota Importante

El proyecto usa **GitHub Actions con workflows corporativos** (`bancodebogota/bbog-can-pipeline`) para CI/CD automatizado.

Los scripts en esta carpeta son solo para:

- 🔧 Troubleshooting
- 📚 Documentación de procesos
- 🚨 Emergencias (si GitHub Actions no está disponible)

**Para deployments normales, usa los workflows automáticos** (push a branches `qa`, `staging`, `main`).

---

## 📋 Scripts Disponibles

### `deploy-lambda.sh`

Despliega la aplicación Lambda manualmente sin CI/CD.

**Uso:**

```bash
./deploy-lambda.sh [production|staging|qa]
```

**¿Cuándo usar?**

- 🚨 GitHub Actions caído
- 🔧 Testing de deployment local
- 📚 Entender el proceso de deployment

**Equivalente automatizado:**

- Push a `qa` → Ejecuta `.github/workflows/qa.yml`
- Push a `staging` → Ejecuta `.github/workflows/stg.yml`
- Push a `main` → Ejecuta `.github/workflows/prod.yml`

---

### `deploy-infrastructure.sh`

Despliega la infraestructura AWS usando CDK.

**Uso:**

```bash
./deploy-infrastructure.sh [production|staging]
```

**¿Cuándo usar?**

- ⚙️ Setup inicial del proyecto (una sola vez)
- 🔄 Cambios en infraestructura (CDK stacks)
- 🏗️ Crear nuevos ambientes

**Nota:** Este script NO se ejecuta en CI/CD. La infraestructura se despliega una vez manualmente.

---

### `create-dynamodb-table.sh`

Crea la tabla DynamoDB manualmente.

**Uso:**

```bash
./create-dynamodb-table.sh [production|staging|qa]
```

**¿Cuándo usar?**

- 🔧 Testing local de DynamoDB
- 📚 Entender la estructura de la tabla

**Nota:** En producción, CDK crea la tabla automáticamente (ver `infrastructure/lib/kata-backend-stack.ts`).

---

### `restart-backend.sh`

Reinicia el backend de desarrollo local.

**Uso:**

```bash
./restart-backend.sh
```

**¿Cuándo usar?**

- 🔄 Desarrollo local
- 🐛 Resetear estado de DynamoDB Local

**Nota:** Lambda en AWS no necesita restart (serverless).

---

## 🔄 Flujo Normal de Deployment (Automatizado)

```bash
# 1. Desarrollar feature
git checkout -b feature/nueva-funcionalidad
# ... código ...
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad

# 2. Crear PR a qa
# → Se ejecuta .github/workflows/requirements.yml (checks)

# 3. Merge a qa
git checkout qa
git merge feature/nueva-funcionalidad
git push origin qa
# → Se ejecuta .github/workflows/qa.yml (deploy automático)

# 4. Testing en QA, luego merge a staging
git checkout staging
git merge qa
git push origin staging
# → Se ejecuta .github/workflows/stg.yml (deploy automático)

# 5. Testing en Staging, luego merge a main
git checkout main
git merge staging
git push origin main
# → Se ejecuta .github/workflows/prod.yml (deploy automático)
```

**Sin necesidad de ejecutar scripts manualmente.** ✅

---

## 🚨 Deployment Manual (Emergencia)

Si GitHub Actions no está disponible:

```bash
# 1. Build local
npm ci
npm run build

# 2. Deploy con script
cd docs/manual-deployment
./deploy-lambda.sh production

# 3. Verificar
curl https://API_ENDPOINT/health
```

---

## 📊 Comparación: Manual vs Automatizado

| Aspecto       | Manual (Scripts)   | Automatizado (Workflows) |
| ------------- | ------------------ | ------------------------ |
| **Tiempo**    | 5-10 minutos       | 2-3 minutos              |
| **Errors**    | Propenso a errores | Consistente              |
| **Logs**      | Terminal local     | GitHub UI + CloudWatch   |
| **Rollback**  | Manual             | Automático si falla      |
| **Approvals** | No                 | Sí (en prod)             |
| **Secrets**   | Local (.env)       | GitHub Secrets           |
| **Auditoría** | No                 | Sí (GitHub logs)         |

---

## 🔗 Referencias

- [GitHub Actions Workflows](../../.github/workflows/)
- [CDK Infrastructure](../../infrastructure/)
- [Pipeline Configuration](../../pipeline/)

---

**Mantenido por:** Equipo Backend  
**Última actualización:** Diciembre 2025  
**Uso recomendado:** Solo para emergencias o troubleshooting
