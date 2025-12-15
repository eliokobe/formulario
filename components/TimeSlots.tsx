"use client";

import { generateTimeSlots, isSlotInPast } from '@/lib/time-utils';
import { cn } from '@/lib/utils';
import { isWeekend, isBefore, startOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TimeSlotsProps {
  selectedDate: Date;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
}

export function TimeSlots({ selectedDate, selectedTime, onTimeSelect }: TimeSlotsProps) {
  const timeSlots = generateTimeSlots(selectedDate);

  const getUnavailableMessage = () => {
    const today = startOfDay(new Date());
    
    if (isBefore(startOfDay(selectedDate), today)) {
      return `No es posible reservar para el ${format(selectedDate, 'd')} de ${format(selectedDate, 'MMMM', { locale: es })} porque ya ha pasado`;
    }
    
    if (isWeekend(selectedDate)) {
      return 'No hay horarios disponibles los fines de semana';
    }
    
    return 'No hay horarios disponibles para esta fecha';
  };

  if (timeSlots.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Horarios Disponibles</h3>
        <p className="text-gray-500 text-center py-4">
          {getUnavailableMessage()}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Horarios Disponibles</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {timeSlots.map((time) => {
          const isInPast = isSlotInPast(selectedDate, time);
          const isSelected = selectedTime === time;

          return (
            <button
              key={time}
              onClick={() => !isInPast && onTimeSelect(time)}
              disabled={isInPast}
              className={cn(
                "p-3 text-sm font-medium rounded-lg border transition-colors",
                isSelected && "bg-[#008606] text-white border-[#008606]",
                !isSelected && !isInPast && "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900",
                isInPast && "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
              )}
            >
              {time}
            </button>
          );
        })}
      </div>
    </div>
  );
}