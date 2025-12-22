"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CitaForm } from '@/components/CitaForm';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/useToastClient';
import { CheckCircle } from 'lucide-react';

export default function CitaPage() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [reparacionId, setReparacionId] = useState<string | undefined>();
  const { toast, showToast, hideToast } = useToast();

  const handleCitaComplete = (reparacionId?: string) => {
    setStatus('success');
    setMessage('¡La cita ha sido programada exitosamente!');
    setReparacionId(reparacionId);
    showToast('¡Cita programada exitosamente!', 'success');
  };

  const handleCitaError = (error: string) => {
    setStatus('error');
    setMessage(error);
    showToast(error, 'error');
  };

  const resetForm = () => {
    setStatus('idle');
    setMessage('');
    setReparacionId(undefined);
  };

  const handleContinueToParte = () => {
    if (reparacionId) {
      window.location.href = `/parte?id=${reparacionId}`;
    } else {
      showToast('No se encontró el ID de reparación', 'error');
    }
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
              ¡Cita Registrada!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-6"
            >
              La cita ha sido programada correctamente
            </motion.p>
            
            {reparacionId ? (
              <>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-700 font-medium mb-6"
                >
                  ¿Quieres continuar con el parte de trabajo?
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
                  <button
                    onClick={handleContinueToParte}
                    className="w-full bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Sí, continuar con el parte
                  </button>
                  <button
                    onClick={() => window.location.href = '/tecnico'}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                  >
                    No, volver al portal
                  </button>
                </motion.div>
              </>
            ) : (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => window.location.href = '/tecnico'}
                className="w-full bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Volver al Portal
              </motion.button>
            )}
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
        <CitaForm 
          onComplete={handleCitaComplete}
          onError={handleCitaError}
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