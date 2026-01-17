# 📁 Archivos de Seguridad

Este directorio contiene la documentación y scripts relacionados con la seguridad de la aplicación.

## 📄 Archivos Principales

### 🔐 Documentación
- **[SEGURIDAD.md](../SEGURIDAD.md)** - Guía completa de seguridad (500+ líneas)
- **[CHANGELOG-SEGURIDAD.md](../CHANGELOG-SEGURIDAD.md)** - Registro de mejoras implementadas
- **[README.md](../README.md)** - Incluye sección de seguridad

### 🛠️ Scripts
- **[check-security.js](../check-security.js)** - Verificador automatizado
  - Comando: `npm run check-security`
  - Verifica configuración y detecta problemas

### ⚙️ Configuración
- **[middleware.ts](../middleware.ts)** - Middleware de seguridad
- **[next.config.js](../next.config.js)** - Headers HTTP seguros
- **[.env.example](../.env.example)** - Plantilla documentada
- **[.gitignore](../.gitignore)** - Protege archivos sensibles

### 🔒 Archivos Protegidos (NO en Git)
- `.env.local` - Variables de entorno locales
- `.env` - Variables de entorno genéricas

## 🚀 Uso Rápido

```bash
# Verificar seguridad
npm run check-security

# Ver documentación
cat SEGURIDAD.md

# Ver mejoras implementadas
cat CHANGELOG-SEGURIDAD.md
```

## ✅ Estado Actual

**Nivel de Seguridad:** Alto ✅  
**API Keys Protegidas:** Sí ✅  
**Producción Ready:** Sí ✅

---

Para más información, lee [SEGURIDAD.md](../SEGURIDAD.md)
