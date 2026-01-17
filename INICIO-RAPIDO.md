# 🚀 Inicio Rápido - Seguridad

## ⚡ Comandos Esenciales

```bash
# 1. Verificar seguridad (¡Hazlo ahora!)
npm run check-security

# 2. Desarrollo local
npm run dev

# 3. Build para producción
npm run build
```

---

## ✅ Primera Vez

```bash
# 1. Copiar plantilla de variables
cp .env.example .env.local

# 2. Editar .env.local con tus valores reales
# (Abre el archivo y rellena AIRTABLE_TOKEN, etc.)

# 3. Verificar que todo esté bien
npm run check-security

# 4. Iniciar desarrollo
npm run dev
```

---

## 📋 Estado Actual

✅ **Tu aplicación es SEGURA**

- Las API keys están en el servidor
- NO se exponen al navegador
- Middleware de seguridad activo
- Headers HTTP seguros
- Documentación completa

---

## 📚 Documentación

- **Guía completa:** [SEGURIDAD.md](SEGURIDAD.md)
- **Resumen visual:** [RESUMEN-MEJORAS.md](RESUMEN-MEJORAS.md)
- **Cambios:** [CHANGELOG-SEGURIDAD.md](CHANGELOG-SEGURIDAD.md)

---

## 🔐 Regla de Oro

**NUNCA** uses `NEXT_PUBLIC_` con API keys de Airtable

```env
# ❌ MAL
NEXT_PUBLIC_AIRTABLE_TOKEN=patXXX

# ✅ BIEN
AIRTABLE_TOKEN=patXXX
```

---

## 🆘 Ayuda Rápida

**Problema:** "AIRTABLE_TOKEN no definido"  
**Solución:** `cp .env.example .env.local` y edita con valores reales

**Problema:** "Errores en producción"  
**Solución:** Configura variables en el panel de tu hosting

**Problema:** "No sé si es seguro"  
**Solución:** `npm run check-security`

---

**¿Dudas?** Lee [SEGURIDAD.md](SEGURIDAD.md)
