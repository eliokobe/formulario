# 📋 Formulario Ritest - Parte de Trabajo

Una aplicación web moderna para gestión de partes de trabajo técnico integrada con Airtable, desarrollada con Next.js 14 y TypeScript.

## 🚀 Características Principales

### 📱 **Formulario Inteligente**
- **Datos Precargados**: Los datos del cliente se cargan automáticamente desde Airtable
- **Lógica Condicional**: Preguntas dinámicas según el tipo de reparación
- **Validación en Tiempo Real**: Feedback inmediato con validaciones robustas
- **Responsive Design**: Optimizado para móviles y tablets

### 🔧 **Integración con Airtable**
- **Base ID**: `appX3CBiSmPy4119D`
- **Tabla**: "Reparaciones"
- **URLs Únicas**: Cada registro genera su enlace personalizado
- **Sincronización Bidireccional**: Lee y actualiza datos automáticamente

### 📸 **Documentación Fotográfica**
- **Cámara Directa**: Toma fotos sin apps adicionales
- **Subida de Archivos**: Compatible con archivos existentes
- **Compresión**: Optimización automática de imágenes

## 🏗️ Estructura del Formulario

### **1. Datos Generales** (Precargados desde Airtable)
- **Cliente**: Información del cliente (solo lectura)
- **Dirección**: Ubicación del servicio (solo lectura) 
- **Técnico**: Técnico asignado (solo lectura)

### **2. Reparación** (Lógica Condicional)
- **Estado**: "Reparado" o "Sin reparar"
- **Si Reparado**: Opciones de trabajo realizado
  - Repara el cuadro eléctrico (con sub-opciones)
  - Resetear la placa electrónica
  - Sustituir el punto de recarga
  - Revisar la instalación
- **Si Sin Reparar**: Campo libre para describir el problema

### **3. Documentación**
- **Foto del Punto**: Imagen del resultado final
- **Factura**: Documentación del servicio

## 🛠️ Tecnologías Utilizadas

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Validación**: Zod
- **Formularios**: React Hook Form
- **Base de Datos**: Airtable
- **UI Components**: Componentes personalizados
- **Iconos**: Lucide React

## ⚡ Instalación y Configuración

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/eliok7/formulario-ritest.git
cd formulario-ritest
```

### **2. Instalar Dependencias**
```bash
npm install
```

### **3. Configurar Variables de Entorno** 🔒
```bash
# Copiar plantilla de variables de entorno
cp .env.example .env.local

# Editar .env.local con tus valores reales
# ⚠️ IMPORTANTE: Nunca subas .env.local a Git
```

**Contenido de `.env.local`:**
```env
# Airtable (SOLO SERVIDOR - No se expone al cliente)
AIRTABLE_TOKEN=tu_token_personal_de_airtable
AIRTABLE_BASE_ID=appX3CBiSmPy4119D
AIRTABLE_TABLE_REPARACIONES=Reparaciones
AIRTABLE_TABLE_FORMULARIO=Formularios
AIRTABLE_TABLE_NAME=Servicios
AIRTABLE_TABLE_CLIENTES=Servicios
AIRTABLE_TABLE_SERVICIOS=Servicios

# UploadThing
UPLOADTHING_SECRET=tu_uploadthing_secret
UPLOADTHING_APP_ID=tu_uploadthing_app_id
```

> 🔐 **Seguridad**: Las API keys se mantienen en el servidor y NUNCA se exponen al navegador. Lee [SEGURIDAD.md](SEGURIDAD.md) para más detalles.

### **4. Verificar Configuración de Seguridad** ✅
```bash
npm run check-security
```

Este comando verifica que:
- ✅ Las variables de entorno estén configuradas
- ✅ No haya API keys hardcodeadas
- ✅ `.env.local` esté en `.gitignore`
- ✅ No haya llamadas directas a Airtable desde el cliente

### **4. Configurar Airtable**

#### **Columnas Requeridas en la Tabla "Reparaciones":**
| Columna | Tipo | Configuración |
|---------|------|---------------|
| Cliente | Single line text | - |
| Dirección | Long text | - |
| Técnico | Single line text | - |
| Reparación | Formula | `"https://tu-dominio.com/onboarding?recordId=" & RECORD_ID()` |
| Estado | Single select | Opciones: Pendiente, Completado |

### **5. Ejecutar en Desarrollo**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🔒 Seguridad

### **Arquitectura Segura**

```
┌─────────────┐         ┌──────────────┐         ┌───────────┐
│  Frontend   │ ---->   │   Next.js    │ ---->   │ Airtable  │
│ (Navegador) │ API     │   Backend    │ API     │    API    │
│  SIN claves │ /api/*  │  CON claves  │ Bearer  │           │
└─────────────┘         └──────────────┘         └───────────┘
```

**Características de Seguridad:**
- ✅ API keys solo en el servidor (nunca en el navegador)
- ✅ Middleware de seguridad en todas las rutas API
- ✅ Headers de seguridad HTTP (CSP, HSTS, etc.)
- ✅ Variables de entorno protegidas en `.gitignore`
- ✅ Sin exposición de credenciales en el cliente

**Para más información:** Lee la [Guía de Seguridad Completa](SEGURIDAD.md)

**Verificar seguridad:**
```bash
npm run check-security
```

## 🔗 URLs y Navegación

### **Rutas Principales**
- `/onboarding` - Formulario principal
- `/onboarding?recordId=recXXX` - Formulario con datos precargados
- `/generate-url` - Generador de URLs para técnicos
- `/test-airtable` - Página de pruebas de conexión

### **Flujo de Trabajo**
1. **Administrador**: Crea registros en Airtable
2. **Sistema**: Genera URLs automáticamente con la fórmula
3. **Envío**: Se comparte el enlace al técnico (WhatsApp/Email)
4. **Técnico**: Accede con datos precargados
5. **Completar**: Solo llena reparación + documentación
6. **Sincronización**: Los datos se actualizan automáticamente en Airtable

## 📦 Estructura del Proyecto

```
formulario-ritest/
├── app/
│   ├── api/
│   │   ├── reparaciones/
│   │   ├── work-orders/
│   │   └── test-airtable/
│   ├── onboarding/
│   ├── generate-url/
│   └── components/
├── lib/
│   ├── airtable.ts
│   ├── validations.ts
│   └── utils.ts
├── components/
│   ├── ui/
│   └── CameraCapture.tsx
└── public/
```

## 🚀 Deployment

### **Vercel / DigitalOcean / Otros (Recomendado)**

1. **Build del proyecto:**
```bash
npm run build
```

2. **Configurar Variables de Entorno en la Plataforma:**

**⚠️ CRÍTICO:** Configura estas variables en el panel de tu hosting (NO en el código):

```env
AIRTABLE_TOKEN=tu_token_personal_aqui
AIRTABLE_BASE_ID=appX3CBiSmPy4119D
AIRTABLE_TABLE_REPARACIONES=Reparaciones
AIRTABLE_TABLE_FORMULARIO=Formularios
AIRTABLE_TABLE_NAME=Servicios
AIRTABLE_TABLE_CLIENTES=Servicios
AIRTABLE_TABLE_SERVICIOS=Servicios
UPLOADTHING_SECRET=tu_uploadthing_secret
UPLOADTHING_APP_ID=tu_uploadthing_app_id
NODE_ENV=production
```

3. **Deploy:**
```bash
# Vercel
vercel --prod

# O desde el panel web de tu plataforma
```

### **Verificar Seguridad Post-Deploy**

Después del deploy, verifica en DevTools del navegador:
1. Abre Network tab (F12)
2. Recarga la página
3. Verifica que:
   - ✅ Solo ves peticiones a `/api/*` (tu dominio)
   - ✅ NO ves peticiones a `api.airtable.com`
   - ✅ NO ves headers `Authorization: Bearer pat...`

> 📘 **Guía completa de seguridad:** [SEGURIDAD.md](SEGURIDAD.md)

## 🔧 Uso y Configuración

### **Para Administradores**
1. Crear registros en Airtable con Cliente, Dirección y Técnico
2. La columna "Reparación" generará automáticamente las URLs
3. Enviar enlaces a los técnicos

### **Para Técnicos**
1. Recibir enlace personalizado
2. Acceder al formulario con datos precargados
3. Completar información de reparación
4. Subir fotos de documentación
5. Enviar formulario

## 📱 Características Móviles

- **Diseño Responsive**: Adaptado para pantallas móviles
- **Cámara Nativa**: Acceso directo a la cámara del dispositivo
- **Navegación Táctil**: Optimizada para uso con dedos
- **Validación Visual**: Feedback claro y visible
- **Carga Progresiva**: Indicadores de estado en tiempo real

## 🎨 Personalización

### **Colores del Brand**
- **Principal**: `#008606` (Verde Ritest)
- **Fondo**: Blanco limpio
- **Textos**: Grises para mejor legibilidad

### **Modificar Campos**
Los campos se pueden personalizar editando:
- `lib/validations.ts` - Esquemas de validación
- `app/onboarding/page.tsx` - Estructura del formulario

## 📞 Soporte y Contacto

Para soporte técnico o dudas sobre la implementación, contactar al desarrollador del proyecto.

---

**Desarrollado para Ritest** - Gestión eficiente de partes de trabajo técnico# formulario-ritest
