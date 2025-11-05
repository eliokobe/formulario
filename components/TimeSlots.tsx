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
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Horarios Disponibles</h3>
        <p className="text-gray-500 text-center py-8">
          {getUnavailableMessage()}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Horarios Disponibles</h3>
      
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
                "p-3 text-sm font-medium rounded-xl border transition-all duration-200 hover:shadow-md",
                isSelected && "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-lg",
                !isSelected && !isInPast && "border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-900 hover:text-blue-600",
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