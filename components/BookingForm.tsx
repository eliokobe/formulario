"use client";

import { useState, useEffect } from 'react';
import { formatDateForDisplay, createUTCDateTime } from '@/lib/time-utils';
import { cn } from '@/lib/utils';
import { Loader2, User, Mail, Wrench, Building, MapPin } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  onBookingComplete: () => void;
  onBookingError: (error: string) => void;
}

export function BookingForm({ 
  selectedDate, 
  selectedTime, 
  onBookingComplete,
  onBookingError 
}: BookingFormProps) {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    tecnico: '',
    cliente: '',
    direccion: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);

  // Load prefilled data from URL parameters
  useEffect(() => {
    const preload = searchParams.get('preload');
    if (preload === 'true') {
      const urlTecnico = searchParams.get('tecnico') || '';
      const urlCliente = searchParams.get('cliente') || '';
      const urlDireccion = searchParams.get('direccion') || '';
      const urlName = searchParams.get('name') || '';
      const urlEmail = searchParams.get('email') || '';
      
      if (urlTecnico || urlCliente || urlDireccion || urlName || urlEmail) {
        setFormData(prev => ({
          ...prev,
          name: urlName,
          email: urlEmail,
          tecnico: urlTecnico,
          cliente: urlCliente,
          direccion: urlDireccion,
        }));
        setIsPreloaded(true);
      }
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const utcDateTime = createUTCDateTime(selectedDate, selectedTime);
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          tecnico: formData.tecnico.trim(),
          cliente: formData.cliente.trim(),
          direccion: formData.direccion.trim(),
          date_time: utcDateTime,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          onBookingError('This time slot is no longer available. Please select another time.');
          return;
        }
        try {
          const data = await response.json();
          onBookingError(typeof data?.error === 'string' ? data.error : 'Failed to create booking');
        } catch {
          onBookingError('Failed to create booking');
        }
        return;
      }

      onBookingComplete();
      setFormData({ name: '', email: '', tecnico: '', cliente: '', direccion: '' });
    } catch (error: any) {
      const msg = typeof error?.message === 'string' ? error.message : 'Something went wrong. Please try again.';
      onBookingError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Llamada de Descubrimiento</h3>
      
      <div className="mb-6 p-4 bg-gradient-to-r from-[#0059F1]/10 to-[#0059F1]/5 rounded-xl border border-[#0059F1]/20">
        <div className="text-sm text-[#0059F1]">
          <div className="font-medium">{formatDateForDisplay(selectedDate)}</div>
          <div className="text-[#0059F1] font-medium mt-1">{selectedTime}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre Completo *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md",
                errors.name 
                  ? "border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400" 
                  : "border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              )}
              placeholder="Ingresa tu nombre completo"
              disabled={isSubmitting}
            />
          </div>
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Correo Electrónico *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md",
                errors.email 
                  ? "border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400" 
                  : "border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              )}
              placeholder="Ingresa tu correo electrónico"
              disabled={isSubmitting}
            />
          </div>
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#0059F1] hover:bg-[#0059F1]/90 disabled:bg-[#0059F1]/50 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creando Reserva...
            </>
          ) : (
            'Agendar Reunión'
          )}
        </button>
      </form>
    </div>
  );
}