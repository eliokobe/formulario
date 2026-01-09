"use client";

import { useState, useEffect } from 'react';
import { generateTimeSlots, generateHourlyTimeSlots, isSlotInPast, isSlotWithinMinimumBookingTime } from '@/lib/time-utils';
import { cn } from '@/lib/utils';
import { isWeekend, isBefore, startOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TimeSlotsProps {
  selectedDate: Date;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  slotType?: 'hourly' | 'quarter'; // 'hourly' para cita (1h), 'quarter' para diagnóstico (15min)
  checkAvailability?: boolean; // Si debe verificar disponibilidad en Airtable
}

export function TimeSlots({ selectedDate, selectedTime, onTimeSelect, slotType = 'quarter', checkAvailability = true }: TimeSlotsProps) {
  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isTechnician = slotType === 'hourly'; // hourly es para técnicos
  const timeSlots = slotType === 'hourly' ? generateHourlyTimeSlots(selectedDate, isTechnician) : generateTimeSlots(selectedDate);

  // Cargar horas ocupadas cuando cambia la fecha (solo si checkAvailability es true)
  useEffect(() => {
    if (selectedDate && checkAvailability) {
      loadHorasOcupadas();
    } else {
      setHorasOcupadas([]);
    }
  }, [selectedDate, checkAvailability]);

  const loadHorasOcupadas = async () => {
    setIsLoading(true);
    try {
      const fechaStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/disponibilidad?fecha=${fechaStr}`);
      
      if (response.ok) {
        const data = await response.json();
        setHorasOcupadas(data.horasOcupadas || []);
        console.log('Horas ocupadas:', data.horasOcupadas);
      } else {
        console.error('Error al cargar disponibilidad');
        setHorasOcupadas([]);
      }
    } catch (error) {
      console.error('Error al consultar disponibilidad:', error);
      setHorasOcupadas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getUnavailableMessage = () => {
    const today = startOfDay(new Date());
    const isTechnician = slotType === 'hourly';
    
    if (isBefore(startOfDay(selectedDate), today)) {
      return `No es posible reservar para el ${format(selectedDate, 'd')} de ${format(selectedDate, 'MMMM', { locale: es })} porque ya ha pasado`;
    }
    
    if (!isTechnician && isWeekend(selectedDate)) {
      return 'No hay horarios disponibles los fines de semana';
    }
    
    if (isTechnician) {
      return 'No hay horarios disponibles para esta fecha. Solo puede reservar con máximo 2 semanas de anticipación';
    }
    
    return 'No hay horarios disponibles para esta fecha. Solo puede reservar con máximo 2 días laborables de anticipación';
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
      
      {isLoading ? (
        <p className="text-gray-500 text-center py-4">Cargando disponibilidad...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {timeSlots.map((time) => {
            const isInPast = isSlotInPast(selectedDate, time);
            const isWithinMinBooking = isSlotWithinMinimumBookingTime(selectedDate, time);
            const isOcupado = horasOcupadas.includes(time);
            const isSelected = selectedTime === time;
            const isDisabled = isInPast || isWithinMinBooking || isOcupado;

            return (
              <button
                key={time}
                onClick={() => !isDisabled && onTimeSelect(time)}
                disabled={isDisabled}
                className={cn(
                  "p-3 text-sm font-medium rounded-lg border transition-colors",
                  isSelected && "bg-[#008606] text-white border-[#008606]",
                  !isSelected && !isDisabled && "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900",
                  isDisabled && "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
                )}
                title={isOcupado ? 'Horario ocupado' : isWithinMinBooking ? 'Debe reservar con al menos 2 horas de antelación' : isInPast ? 'Horario pasado' : ''}
              >
                {time}
                {isOcupado && !isInPast && <span className="ml-1 text-xs">(Ocupado)</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}