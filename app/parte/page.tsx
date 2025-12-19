"use client";

import { useState } from 'react';
import { RepairForm } from '@/components/RepairForm';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function PartePage() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleRepairComplete = () => {
    setStatus('success');
    setMessage('¡Parte de trabajo creado exitosamente!');
  };

  const handleRepairError = (error: string) => {
    setStatus('error');
    setMessage(error);
  };

  const resetForm = () => {
    setStatus('idle');
    setMessage('');
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Éxito!
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <button
              onClick={() => window.location.href = '/tecnico'}
              className="w-full bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Volver al Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error
          </h1>
          <p className="text-gray-600 mb-8">
            {message}
          </p>
          <button
            onClick={resetForm}
            className="w-full bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Volver al Formulario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <RepairForm 
        onRepairComplete={handleRepairComplete}
        onRepairError={handleRepairError}
      />
    </div>
  );
}