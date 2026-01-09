"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TechnicalSupportForm } from '@/components/TechnicalSupportForm';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/useToastClient';
import { CheckCircle } from 'lucide-react';

export default function DiagnosticoPage() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [citaResumen, setCitaResumen] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const handleSupportComplete = (info?: { resumen?: string }) => {
    setStatus('success');
    setMessage('');
    setCitaResumen(info?.resumen ?? null);
  };

  const handleSupportError = (error: string) => {
    setStatus('error');
    setMessage(error);
    showToast(error, 'error');
  };

  const resetForm = () => {
    setStatus('idle');
    setMessage('');
    setCitaResumen(null);
  };

  if (status === 'success') {
    return (
      <>
        <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white text-center max-w-md mx-auto w-full"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 mb-2"
            >
              {citaResumen ? `Cita telefónica agendada el ${citaResumen}` : 'Cita telefónica agendada'}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-6"
            >
              Nuestro equipo se pondrá en contacto con usted en la fecha y hora agendada.
            </motion.p>
          </motion.div>
        </div>
        {toast.isVisible && (
          <Toast
            message={toast.message}
            type={toast.type}
            isVisible={toast.isVisible}
            onClose={hideToast}
            showIcon={toast.showIcon}
          />
        )}
      </>
    );
  }

  if (status === 'error') {
    return (
      <>
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white text-center max-w-md mx-auto w-full"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error
            </h2>
            <p className="text-gray-600 mb-8">
              {message}
            </p>
            <button
              onClick={resetForm}
              className="w-full bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Volver al Formulario
            </button>
          </motion.div>
        </div>
        {toast.isVisible && (
          <Toast
            message={toast.message}
            type={toast.type}
            isVisible={toast.isVisible}
            onClose={hideToast}
            showIcon={toast.showIcon}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white">
        <TechnicalSupportForm 
          onComplete={handleSupportComplete}
          onError={handleSupportError}
        />
      </div>
      
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
          showIcon={toast.showIcon}
        />
      )}
    </>
  );
}