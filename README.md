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

### **3. Configurar Variables de Entorno**
Crear archivo `.env.local`:
```bash
AIRTABLE_ACCESS_TOKEN=tu_token_aquí
AIRTABLE_BASE_ID=appX3CBiSmPy4119D
AIRTABLE_TABLE_NAME=Reparaciones
```

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

### **Vercel (Recomendado)**
```bash
npm run build
vercel --prod
```

### **Variables de Entorno en Producción**
Configurar en el panel de Vercel:
- `AIRTABLE_ACCESS_TOKEN`
- `AIRTABLE_BASE_ID` 
- `AIRTABLE_TABLE_NAME`

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
