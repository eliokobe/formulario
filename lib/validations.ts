import { z } from 'zod';

export const clientSchema = z.object({
  // Paso 1: Datos generales
  'Nombre de la clínica': z.string().min(1, 'El nombre de la clínica es requerido'),
  Email: z.string().email('Email inválido'),
  Teléfono: z.string().min(1, 'El teléfono es requerido'),
  Dirección: z.string().min(1, 'La dirección es requerida'),
  'Horario de atención': z.string().min(1, 'El horario de atención es requerido'),
  
  // Paso 2: Presencia digital
  '¿Tienen más de una sede?': z.enum(['Sí', 'No'], {
    required_error: 'Selecciona una opción'
  }),
  '¿Tienen ficha en Google Business?': z.enum(['Sí', 'No'], {
    required_error: 'Selecciona una opción'
  }),
  'Enlace a ficha de Google Business': z.string().url('URL inválida').optional().or(z.literal('')),
  'Enlace a su web': z.string().url('URL inválida'),
  '¿Qué calendario usan?': z.string().min(1, 'Este campo es requerido'),
  '¿Cuántos calendario tienen?': z.string().min(1, 'Este campo es requerido'),
  
  // Paso 3: Archivos (handled separately as File objects)
  
  // Paso 4: Seguridad (obligatorio)
  Password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
}).refine((data) => {
  // Validación condicional para Google Business URL
  if (data['¿Tienen ficha en Google Business?'] === 'Sí') {
    const googleBusinessUrl = data['Enlace a ficha de Google Business'];
    if (!googleBusinessUrl || googleBusinessUrl.trim() === '') {
      return false;
    }
    try {
      new URL(googleBusinessUrl);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}, {
  message: "El enlace a Google Business es requerido y debe ser una URL válida cuando tienen ficha en Google Business",
  path: ["Enlace a ficha de Google Business"]
});

export type ClientFormData = z.infer<typeof clientSchema>;