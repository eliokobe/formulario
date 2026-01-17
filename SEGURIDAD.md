# 🔒 Guía de Seguridad - API Keys y Backend

## 📋 Resumen

Esta aplicación está diseñada con una arquitectura segura donde **las API keys de Airtable nunca se exponen al cliente (navegador)**. Todas las comunicaciones con Airtable se realizan a través del backend de Next.js.

## 🏗️ Arquitectura de Seguridad

```
┌─────────────────┐
│   NAVEGADOR     │
│   (Frontend)    │
└────────┬────────┘
         │ 1. Peticiones a /api/*
         │ (SIN API keys)
         ↓
┌─────────────────┐
│  NEXT.JS API    │
│   (Backend)     │  ← 2. Lee AIRTABLE_TOKEN desde .env
└────────┬────────┘
         │ 3. Peticiones a Airtable API
         │ (CON API keys)
         ↓
┌─────────────────┐
│   AIRTABLE      │
│      API        │
└─────────────────┘
```

## ✅ Implementación Actual

### 1. Variables de Entorno (Servidor)

Las API keys están en archivos **que NO se suben a Git**:
- `.env.local` (desarrollo local)
- Variables de entorno en plataforma de hosting (producción)

**Archivo:** `.env.local`
```env
AIRTABLE_TOKEN=patXXXXXXXXXXXX  # ⚠️ NUNCA subir a Git
AIRTABLE_BASE_ID=appXXXXXXXXXX  # ⚠️ NUNCA subir a Git
```

### 2. Backend (API Routes)

**Ubicación:** `app/api/*/route.ts` y `lib/airtable.ts`

- ✅ Las API keys se leen con `process.env.AIRTABLE_TOKEN`
- ✅ Solo se ejecuta en el servidor
- ✅ El cliente nunca ve estas variables

**Ejemplo:** `lib/airtable.ts`
```typescript
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN; // Solo servidor
```

### 3. Frontend (Componentes)

**Ubicación:** `components/*.tsx`

- ✅ Solo hace peticiones a `/api/*` (tus propias rutas)
- ✅ NUNCA hace peticiones directas a `api.airtable.com`
- ✅ NUNCA usa API keys

**Ejemplo:** `components/ReparacionForm.tsx`
```typescript
// ✅ CORRECTO: Petición a tu API
const response = await fetch('/api/reparaciones');

// ❌ INCORRECTO: Petición directa a Airtable (NO hacer esto)
// const response = await fetch('https://api.airtable.com/v0/...');
```

### 4. Middleware de Seguridad

**Archivo:** `middleware.ts`

- Verifica que las variables de entorno estén configuradas
- Añade headers de seguridad adicionales
- Protege todas las rutas `/api/*`

### 5. Headers de Seguridad HTTP

**Archivo:** `next.config.js`

Headers implementados:
- `X-Content-Type-Options: nosniff` - Previene MIME sniffing
- `X-Frame-Options: DENY` - Previene clickjacking
- `X-XSS-Protection` - Protección XSS del navegador
- `Content-Security-Policy` - Política de contenido
- `Strict-Transport-Security` - Forzar HTTPS

## 🚫 Reglas Importantes

### ❌ NUNCA Hacer:

1. **NO uses `NEXT_PUBLIC_` con API keys:**
   ```env
   # ❌ MAL - Se expone al navegador
   NEXT_PUBLIC_AIRTABLE_TOKEN=patXXXXXX
   ```

2. **NO hagas peticiones directas a Airtable desde componentes:**
   ```typescript
   // ❌ MAL
   fetch('https://api.airtable.com/v0/...', {
     headers: { 'Authorization': 'Bearer ...' }
   });
   ```

3. **NO subas `.env.local` a Git:**
   - Ya está en `.gitignore` ✅

### ✅ SIEMPRE Hacer:

1. **Usa variables sin prefijo para el servidor:**
   ```env
   # ✅ BIEN - Solo servidor
   AIRTABLE_TOKEN=patXXXXXX
   ```

2. **Haz peticiones a tu API:**
   ```typescript
   // ✅ BIEN
   const response = await fetch('/api/reparaciones');
   ```

3. **Usa `.env.example` como plantilla:**
   - Documenta variables necesarias sin valores reales

## 🔧 Configuración por Entorno

### Desarrollo Local

1. Copia `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Rellena con tus valores reales:
   ```env
   AIRTABLE_TOKEN=tu_token_real
   AIRTABLE_BASE_ID=tu_base_id
   ```

3. **NUNCA** subas `.env.local` a Git (ya está en `.gitignore`)

### Producción (DigitalOcean/Vercel/etc.)

1. Configura las variables en el panel de tu plataforma
2. NO las incluyas en el código fuente
3. Usa las mismas claves que en `.env.example`

## 🧪 Verificación de Seguridad

### Comprobar que NO se exponen las API keys:

1. **Abre DevTools del navegador** (F12)
2. **Ve a la pestaña Network**
3. **Recarga la página**
4. **Inspecciona cualquier petición**
5. **Verifica:**
   - ✅ Solo ves peticiones a `/api/*` (tu dominio)
   - ✅ NO ves peticiones a `api.airtable.com`
   - ✅ NO ves headers con `Authorization: Bearer patXXX`

### Comprobar las variables en el navegador:

Abre la consola del navegador y ejecuta:
```javascript
// ❌ Debería ser undefined (seguro)
console.log(process.env.AIRTABLE_TOKEN); // undefined

// ⚠️ Solo variables NEXT_PUBLIC_* son visibles
console.log(process.env.NEXT_PUBLIC_API_URL); // Si la defines
```

## 📊 Flujo de Datos Seguro

### Ejemplo: Crear una Reparación

1. **Usuario llena el formulario** → `components/ReparacionForm.tsx`

2. **Frontend envía datos** → `POST /api/reparaciones`
   ```typescript
   const response = await fetch('/api/reparaciones', {
     method: 'POST',
     body: JSON.stringify(formData)
   });
   ```

3. **Backend (API Route) recibe datos** → `app/api/reparaciones/route.ts`
   ```typescript
   export async function POST(request: Request) {
     const data = await request.json();
     // Aquí se usa AIRTABLE_TOKEN del servidor
     return await createRecord('Reparaciones', data);
   }
   ```

4. **Backend usa API de Airtable** → `lib/airtable.ts`
   ```typescript
   const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN; // ✅ Servidor
   
   fetch('https://api.airtable.com/v0/...', {
     headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
   });
   ```

5. **Backend devuelve respuesta** → Frontend muestra resultado

**🔐 En ningún momento el navegador ve la API key**

## 🛡️ Mejores Prácticas Adicionales

### 1. Rotación de API Keys
- Cambia periódicamente tus tokens de Airtable
- Actualiza solo en `.env.local` y plataforma de hosting

### 2. Permisos Mínimos
- Usa tokens con los permisos mínimos necesarios
- Considera crear diferentes bases con acceso limitado

### 3. Monitoreo
- Revisa logs de Airtable regularmente
- Detecta uso inusual de API

### 4. Rate Limiting
- El middleware actual tiene estructura básica
- Para producción, considera: [Upstash Rate Limit](https://upstash.com/docs/redis/features/ratelimiting)

### 5. HTTPS Obligatorio
- Siempre usa HTTPS en producción
- El header `Strict-Transport-Security` ya está configurado

## 📚 Archivos Clave de Seguridad

| Archivo | Propósito | Se sube a Git |
|---------|-----------|---------------|
| `.env.local` | Variables de desarrollo | ❌ NO |
| `.env.example` | Plantilla sin valores reales | ✅ SÍ |
| `.gitignore` | Excluye archivos sensibles | ✅ SÍ |
| `middleware.ts` | Protección de API routes | ✅ SÍ |
| `next.config.js` | Headers de seguridad | ✅ SÍ |
| `lib/airtable.ts` | Cliente Airtable (servidor) | ✅ SÍ |

## 🆘 Problemas Comunes

### "Error: AIRTABLE_TOKEN no definido"
- **Causa:** `.env.local` no existe o está mal configurado
- **Solución:** Copia `.env.example` a `.env.local` y rellena valores

### "Las peticiones a Airtable fallan en producción"
- **Causa:** Variables de entorno no configuradas en hosting
- **Solución:** Añade las variables en el panel de tu plataforma

### "Veo mi API key en el código fuente del navegador"
- **Causa:** Usaste `NEXT_PUBLIC_` o incluiste la key en el cliente
- **Solución:** NUNCA uses `NEXT_PUBLIC_` con API keys sensibles

## 🎯 Checklist de Seguridad

Antes de hacer deploy:

- [ ] `.env.local` está en `.gitignore`
- [ ] No hay API keys hardcodeadas en el código
- [ ] No hay variables `NEXT_PUBLIC_AIRTABLE_*`
- [ ] Todas las llamadas a Airtable son desde `/api/*`
- [ ] Variables configuradas en plataforma de hosting
- [ ] Headers de seguridad activos
- [ ] HTTPS habilitado en producción
- [ ] Middleware de seguridad funcionando

## 📞 Soporte

Si tienes dudas sobre la seguridad:

1. Revisa que todas las llamadas a Airtable pasen por `/api/*`
2. Verifica que `.env.local` no se suba a Git
3. Comprueba en DevTools que no hay peticiones directas a Airtable
4. Asegúrate de que `AIRTABLE_TOKEN` sea `undefined` en el navegador

---

**✅ Tu aplicación está configurada de forma segura. Las API keys nunca se exponen al cliente.**
