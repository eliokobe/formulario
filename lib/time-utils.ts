import { format, addMinutes, setHours, setMinutes, isWeekend, isAfter, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Generar franjas de 1 hora de 8:00 a 21:00 para formulario de cita
export function generateHourlyTimeSlots(date: Date): string[] {
  const today = startOfDay(new Date());
  
  // Skip weekends and past dates
  if (isWeekend(date) || isBefore(startOfDay(date), today)) {
    return [];
  }

  const slots: string[] = [];
  
  // Generar slots de 8:00 a 21:00 con intervalos de 1 hora
  for (let hour = 8; hour <= 21; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  return slots;
}

// Generar franjas de 15 minutos para formulario de diagnóstico (9-14 y 15-18)
export function generateTimeSlots(date: Date): string[] {
  const today = startOfDay(new Date());
  
  // Skip weekends and past dates
  if (isWeekend(date) || isBefore(startOfDay(date), today)) {
    return [];
  }

  const slots: string[] = [];
  
  // Generar slots de 9:00 a 14:00 con intervalos de 15 minutos
  for (let hour = 9; hour < 14; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  
  // Añadir el slot de las 14:00
  slots.push('14:00');
  
  // Generar slots de 15:00 a 18:00 con intervalos de 15 minutos
  for (let hour = 15; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      // No incluir slots después de las 18:00
      if (hour === 18 && minute > 0) break;
      
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }

  return slots;
}

export function isSlotInPast(date: Date, timeSlot: string): boolean {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const slotDateTime = setMinutes(setHours(date, hours), minutes);
  return isBefore(slotDateTime, new Date());
}

export function formatDateForDisplay(date: Date): string {
  const formatted = format(date, 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: es });
  // Capitalizar la primera letra
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function createUTCDateTime(date: Date, timeSlot: string): string {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const localDateTime = setMinutes(setHours(date, hours), minutes);
  return localDateTime.toISOString();
}

export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}