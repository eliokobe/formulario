"use client";

import { useState } from 'react';
import ReparacionForm from '@/components/ReparacionForm';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReparacionPage() {
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [message, setMessage] = useState<string>('');

  const handleSuccess = () => {
    setStatus('success');
    setMessage('¡Reparación registrada exitosamente!');
  };

  const handleError = (error: string) => {
    setStatus('error');
    setMessage(error);
  };



  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-t from-green-600 to-black flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20 text-center max-w-md mx-auto"
        >
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            ¡Perfecto!
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            {message}
          </p>
        </motion.div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-t from-red-600 to-black flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20 text-center max-w-md mx-auto"
        >
          <div className="flex justify-center mb-6">
            <AlertCircle className="w-16 h-16 text-red-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Oops!
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            {message}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-green-600 to-black">
      <ReparacionForm
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}