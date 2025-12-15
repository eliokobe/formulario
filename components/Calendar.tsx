"use client";

import { useState, useEffect } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onError?: (message: string) => void;
}

export function Calendar({ selectedDate, onDateSelect, onError }: CalendarProps) {
  // SIEMPRE empezar con el mes actual - calcular en tiempo real
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  // FORZAR actualización al mes actual CADA VEZ que se monta
  useEffect(() => {
    const now = new Date();
    setCurrentMonth(now);
    console.log('📅 Calendar mounted/remounted, forced to current month:', format(now, 'MMMM yyyy', { locale: es }));
  }, []); // Sin dependencias para que se ejecute SOLO al montar

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  // SIEMPRE calcular "hoy" en tiempo real
  const today = startOfDay(new Date());

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const isDateDisabled = (date: Date) => {
    // No deshabilitar visualmente ningún día
    // La validación se hará solo al hacer click
    return false;
  };

  // NUNCA mostrar como seleccionada una fecha del pasado
  const isDateSelected = (date: Date) => {
    return selectedDate && isSameDay(date, selectedDate);
  };

  const handleDateClick = (date: Date) => {
    // Permitir seleccionar cualquier fecha - la validación se hará en TimeSlots
    onDateSelect(date);
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            type="button"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            type="button"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date) => {
          const isDisabled = isDateDisabled(date);
          const isSelected = isDateSelected(date);
          const isTodayDate = false; // No mostrar ningún día como "hoy"
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              disabled={isDisabled}
              type="button"
            className={cn(
              "p-3 text-sm rounded-lg font-medium transition-colors",
              isSelected && "bg-[#008606] text-white",
              !isSelected && !isDisabled && isCurrentMonth && "hover:bg-gray-100 text-gray-900",
              !isCurrentMonth && "text-gray-300",
              isDisabled && "text-gray-300 cursor-not-allowed"
            )}
            >
              {format(date, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}