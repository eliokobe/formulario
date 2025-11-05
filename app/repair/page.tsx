"use client";

import { useState } from 'react';
import { RepairForm } from '@/components/RepairForm';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/useToastClient';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function RepairPage() {
  const { toast, showToast, hideToast } = useToast();
  const [isCompleted, setIsCompleted] = useState(false);

  const handleRepairComplete = () => {
    setIsCompleted(true);
    showToast('¡Reparación guardada exitosamente!', 'success');
    
    // Reset after 3 seconds
    setTimeout(() => {
      setIsCompleted(false);
      // Optionally reload or redirect
      window.location.reload();
    }, 3000);
  };

  const handleRepairError = (error: string) => {
    showToast(error, 'error');
  };

  if (isCompleted) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-t from-[#008606] to-black flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md mx-auto"
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
              ¡Reparación Guardada!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-4"
            >
              La información de la reparación se ha guardado correctamente.
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

  return (
    <>
      <div className="min-h-screen bg-gradient-to-t from-[#008606] to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Repair Form */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <RepairForm
                onRepairComplete={handleRepairComplete}
                onRepairError={handleRepairError}
              />
            </motion.div>
          </div>
        </div>
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
