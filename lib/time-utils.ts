import { format, addMinutes, setHours, setMinutes, isWeekend, isAfter, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export function generateTimeSlots(date: Date): string[] {
  const today = startOfDay(new Date());
  
  // Skip weekends and past dates
  if (isWeekend(date) || isBefore(startOfDay(date), today)) {
    return [];
  }

  const slots: string[] = [];
  
  // Definir los períodos de disponibilidad
  const timeRanges = [
    { start: 8, end: 10 },   // 8:00 - 10:00
    { start: 12, end: 14 },  // 12:00 - 14:00
    { start: 16, end: 18 }   // 16:00 - 18:00
  ];

  // Generar slots para cada período con intervalos de 15 minutos
  timeRanges.forEach(({ start, end }) => {
    const startTime = setMinutes(setHours(date, start), 0);
    const endTime = setMinutes(setHours(date, end), 0);
    
    let currentTime = startTime;
    
    while (isBefore(currentTime, endTime)) {
      slots.push(format(currentTime, 'HH:mm'));
      currentTime = addMinutes(currentTime, 15); // Intervalos de 15 minutos
    }
  });

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