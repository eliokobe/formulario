"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  CheckCircle, 
  Calendar as CalendarIcon,
  Clock,
  User,
  ChevronRight
} from 'lucide-react';
// collaborator image removed - keep minimal layout
import { Calendar } from './Calendar';
import { TimeSlots } from './TimeSlots';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CitaFormProps {
  onComplete: () => void;
  onError: (error: string) => void;
}

export function CitaForm({ onComplete, onError }: CitaFormProps) {
  const [currentStep, setCurrentStep] = useState(1); // Paso 1: detalles, Paso 2: calendario
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [servicioId, setServicioId] = useState<string>('');
  const [existingData, setExistingData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos del servicio si existe en la URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    
    if (idParam) {
      setServicioId(idParam);
      loadServiceData(idParam);
    } else {
      onError('ID de servicio no encontrado en la URL');
    }
  }, []);

  const loadServiceData = async (id: string) => {
    try {
      const response = await fetch(`/api/servicios?id=${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setExistingData(data);
        console.log('Datos del servicio cargados:', data);
      } else {
        console.error('Error al cargar datos del servicio:', response.status);
        onError('Error al cargar los datos del servicio');
      }
    } catch (error) {
      console.error('Error al cargar datos del servicio:', error);
      onError('Error de conexión al cargar los datos del servicio');
    }
  };

  const handleSubmit = async () => {
    // Validar que se haya seleccionado fecha y hora
    if (!selectedDate) {
      setErrors({ fecha: 'Por favor selecciona una fecha' });
      return;
    }
    
    if (!selectedTime) {
      setErrors({ hora: 'Por favor selecciona una hora' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Crear fecha y hora en formato ISO 8601 para Airtable
      const [hours, minutes] = selectedTime.split(':');
      const fechaHora = new Date(selectedDate);
      fechaHora.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Formato ISO 8601 que Airtable acepta para campos de fecha/hora
      const isoDateTime = fechaHora.toISOString();

      const citaData = {
        "Cita técnico": isoDateTime,
      };

      // Actualizar el registro en la tabla Servicios
      const response = await fetch(`/api/servicios?id=${servicioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(citaData),
      });

      if (!response.ok) {
        throw new Error('Error al programar la cita');
      }

      console.log('Cita programada exitosamente:', citaData);
      onComplete();

    } catch (error: any) {
      const msg = typeof error?.message === 'string' ? error.message : 'Error al programar la cita. Inténtalo de nuevo.';
      onError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueToBooking = () => {
    setCurrentStep(2);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time selection when date changes
    if (errors.fecha) {
      setErrors(prev => ({ ...prev, fecha: '' }));
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (errors.hora) {
      setErrors(prev => ({ ...prev, hora: '' }));
    }
  };

  // Paso 1: Mostrar detalles del servicio
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-white p-4 sm:p-6">
        <div className="max-w-md mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Cita Técnica
            </h1>
            <p className="text-gray-600">
              Confirma los detalles de tu servicio
            </p>
          </motion.div>

          {/* Información del servicio existente */}
          {existingData && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4 mb-8"
            >
              {existingData.Cliente && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <span className="text-gray-500 text-sm font-medium">Cliente</span>
                  <div className="font-semibold text-gray-900 mt-1">{existingData.Cliente}</div>
                </div>
              )}
              {existingData.Teléfono && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <span className="text-gray-500 text-sm font-medium">Teléfono</span>
                  <div className="font-semibold text-gray-900 mt-1">{existingData.Teléfono}</div>
                </div>
              )}
              {existingData.Dirección && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <span className="text-gray-500 text-sm font-medium">Dirección</span>
                  <div className="font-semibold text-gray-900 mt-1">{existingData.Dirección}</div>
                </div>
              )}
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleContinueToBooking}
            className="w-full bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            Programar Cita
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    );
  }

  // Paso 2: Selección de fecha y hora
  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Selecciona Fecha y Hora
          </h1>
          <p className="text-gray-600">
            Elige el momento que mejor te convenga
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Selección de fecha */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onError={onError}
            />
            {errors.fecha && (
              <p className="text-red-600 text-sm mt-2 text-center">{errors.fecha}</p>
            )}
          </motion.div>

          {/* Selección de hora */}
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TimeSlots
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
              />
              {errors.hora && (
                <p className="text-red-600 text-sm mt-2 text-center">{errors.hora}</p>
              )}
            </motion.div>
          )}

          {/* Botón de confirmación */}
          {selectedDate && selectedTime && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border-t border-gray-100 pt-6 mt-6"
            >
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-sm text-gray-700 text-center">
                  <div className="font-semibold">Cita programada para:</div>
                  <div className="text-lg font-bold text-[#008606] mt-1">
                    {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })} - {selectedTime}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-[#008606] hover:bg-[#008606]/90 disabled:bg-[#008606]/50 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Programando cita...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirmar Cita Técnica
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}