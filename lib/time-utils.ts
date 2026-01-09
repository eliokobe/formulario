import { format, addMinutes, setHours, setMinutes, isWeekend, isAfter, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Calcular días laborables entre dos fechas (excluyendo fines de semana)
function countBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// Verificar si una fecha está dentro del rango permitido (máximo 2 días laborables)
function isWithinBusinessDaysLimit(date: Date, maxBusinessDays: number = 2): boolean {
  const today = startOfDay(new Date());
  const targetDate = startOfDay(date);
  
  // Si es hoy, está permitido
  if (targetDate.getTime() === today.getTime()) {
    return true;
  }
  
  // Contar días laborables desde mañana hasta la fecha objetivo
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const businessDaysAhead = countBusinessDays(tomorrow, targetDate);
  return businessDaysAhead <= maxBusinessDays;
}

// Verificar si una fecha está dentro de un número de días calendario (para técnicos)
function isWithinCalendarDaysLimit(date: Date, maxDays: number = 14): boolean {
  const today = startOfDay(new Date());
  const targetDate = startOfDay(date);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDays);
  
  return !isAfter(targetDate, maxDate);
}

// Generar franjas de 1 hora de 8:00 a 21:00 para formulario de cita (técnicos)
export function generateHourlyTimeSlots(date: Date, isTechnician: boolean = true): string[] {
  const today = startOfDay(new Date());
  
  if (isTechnician) {
    // Técnicos: pueden agendar en fines de semana y hasta 2 semanas adelante
    if (isBefore(startOfDay(date), today) || !isWithinCalendarDaysLimit(date, 14)) {
      return [];
    }
  } else {
    // Clientes: no pueden agendar en fines de semana y máximo 2 días laborables
    if (isWeekend(date) || isBefore(startOfDay(date), today) || !isWithinBusinessDaysLimit(date)) {
      return [];
    }
  }

  const slots: string[] = [];
  
  // Generar slots de 8:00 a 21:00 con intervalos de 1 hora
  for (let hour = 8; hour <= 21; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  return slots;
}

// Generar franjas de 30 minutos para formulario de diagnóstico (9-13:30 y 15-17:30)
export function generateTimeSlots(date: Date): string[] {
  const today = startOfDay(new Date());
  
  // Skip weekends, past dates, and dates beyond 2 business days
  if (isWeekend(date) || isBefore(startOfDay(date), today) || !isWithinBusinessDaysLimit(date)) {
    return [];
  }

  const slots: string[] = [];
  
  // Generar slots de 9:00 a 13:30 con intervalos de 30 minutos
  for (let hour = 9; hour < 14; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  
  // Generar slots de 15:00 a 17:30 con intervalos de 30 minutos
  for (let hour = 15; hour <= 17; hour++) {
    for (let minute = 0; minute <= 30; minute += 30) {
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

// Verificar si el slot está dentro del período mínimo de reserva (2 horas desde ahora)
export function isSlotWithinMinimumBookingTime(date: Date, timeSlot: string): boolean {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const slotDateTime = setMinutes(setHours(date, hours), minutes);
  const minimumBookingTime = addMinutes(new Date(), 120); // 2 horas desde ahora
  return isBefore(slotDateTime, minimumBookingTime);
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