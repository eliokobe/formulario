import { format, addMinutes, setHours, setMinutes, isWeekend, isAfter, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export function generateTimeSlots(date: Date): string[] {
  const today = startOfDay(new Date());
  
  // Skip weekends and past dates
  if (isWeekend(date) || isBefore(startOfDay(date), today)) {
    return [];
  }

  const slots: string[] = [];
  
  // Generar slots de 9:00 a 20:00 con intervalos de 1 hora
  for (let hour = 9; hour <= 20; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
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