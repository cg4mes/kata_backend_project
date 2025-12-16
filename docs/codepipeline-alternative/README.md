# Arquitectura Alternativa: AWS CodePipeline

Esta carpeta contiene archivos de configuración para una **arquitectura alternativa** usando **AWS CodePipeline + CodeBuild** en lugar de GitHub Actions.

## ⚠️ Nota Importante

El proyecto actualmente usa **GitHub Actions con workflows reutilizables corporativos** (`bancodebogota/bbog-can-pipeline`), que es el estándar de Banco de Bogotá.

Los archivos BuildSpec en esta carpeta están aquí solo como **referencia** y **no se usan** en el flujo de CI/CD actual.

---

## 📋 Archivos en esta carpeta

### `buildspec-lambda-qa.yml`

BuildSpec para despliegue a QA usando AWS CodeBuild.

**Características:**

- Build de TypeScript
- Instalación de dependencias
- Empaquetado ZIP
- Deploy a Lambda QA

### `buildspec-lambda-staging.yml`

BuildSpec para despliegue a Staging usando AWS CodeBuild.

### `buildspec-lambda.yml`

BuildSpec para despliegue a Production usando AWS CodeBuild.

---

## 🔄 Comparación: CodePipeline vs GitHub Actions

| Aspecto              | CodePipeline    | GitHub Actions (Actual) |
| -------------------- | --------------- | ----------------------- |
| **Configuración**    | BuildSpec YAML  | Workflows YAML          |
| **Ejecución**        | AWS CodeBuild   | GitHub Runners          |
| **Logs**             | CloudWatch      | GitHub UI               |
| **Secrets**          | Secrets Manager | GitHub Secrets          |
| **Costo**            | Por minuto      | Gratis (2000 min/mes)   |
| **Integración**      | 100% AWS        | Git-native              |
| **Corporativo BBOG** | No estándar     | ✅ Estándar             |

---

## 🚀 ¿Cuándo usar CodePipeline?

CodePipeline + BuildSpec sería útil si:

1. **Requisito 100% AWS:** Sin dependencias externas
2. **Builds en VPC:** Necesitas acceso a recursos privados
3. **Integración EventBridge:** Triggers complejos desde AWS
4. **Compliance:** Requisitos de auditoría AWS-only

---

## 💡 ¿Cómo implementar CodePipeline?

Si en el futuro se requiere migrar a CodePipeline:

### 1. Crear Pipeline en AWS

```bash
aws codepipeline create-pipeline \
  --pipeline file://pipeline-definition.json
```

### 2. Configurar CodeBuild Project

```bash
aws codebuild create-project \
  --name kata-backend-build \
  --source type=GITHUB,location=https://github.com/org/repo \
  --artifacts type=NO_ARTIFACTS \
  --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0 \
  --service-role arn:aws:iam::ACCOUNT:role/CodeBuildRole
```

### 3. Usar BuildSpecs de esta carpeta

Los archivos `buildspec-*.yml` ya están listos para usarse.

---

## 📚 Referencias

- [AWS CodePipeline](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild BuildSpec](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html)
- [GitHub Actions vs CodePipeline](https://aws.amazon.com/blogs/devops/comparing-aws-codepipeline-and-github-actions/)

---

**Mantenido por:** Equipo Backend
**Última actualización:** Diciembre 2025
