'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/ui/file-upload';
import { uploadFiles } from '@/lib/upload';
import Image from 'next/image';

interface FormData {
  cliente: string;
  telefono: string;
  direccion: string;
  potenciaContratada: string;
  fechaInstalacion: string;
  detalles: string;
}

interface Errors {
  [key: string]: string;
}

interface FileState {
  fotoGeneral: File[];
  fotoEtiqueta: File[];
  fotoCuadroElectrico: File[];
  fotoRoto: File[];
}

interface ReparacionFormProps {
  recordId?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function ReparacionForm({ recordId, onSuccess, onError }: ReparacionFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    cliente: '',
    telefono: '',
    direccion: '',
    potenciaContratada: '',
    fechaInstalacion: '',
    detalles: ''
  });
  const [files, setFiles] = useState<FileState>({
    fotoGeneral: [],
    fotoEtiqueta: [],
    fotoCuadroElectrico: [],
    fotoRoto: []
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const record = urlParams.get('record');
    if (record && record !== 'undefined') {
      console.log('🔍 Fetching data for record:', record);
      fetchFormData(record);
    } else {
      console.log('❌ No valid record ID found in URL');
    }
  }, []);

  const fetchFormData = async (recordId: string) => {
    try {
      console.log('📡 Fetching data from API for recordId:', recordId);
      const response = await fetch(`/api/reparaciones?recordId=${recordId}`);
      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📡 API Response data:', data);
        
        if (data) {
          const newFormData = {
            cliente: data.cliente || '',
            telefono: data.telefono || '',
            direccion: data.direccion || '',
            potenciaContratada: data.potenciaContratada || '',
            fechaInstalacion: data.fechaInstalacion || '',
            detalles: data.detalles || ''
          };
          console.log('📝 Setting form data:', newFormData);
          setFormData(newFormData);
          
          // Los campos cliente y direccion siempre son readonly si vienen de Airtable
          // El telefono es opcional
          const shouldBeEditMode = !!(data.cliente && data.direccion);
          console.log('🔒 Setting edit mode:', shouldBeEditMode);
          setIsEditMode(shouldBeEditMode);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Error al obtener datos:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching form data:', error);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Datos del cliente';
      case 2:
        return 'Fotos del electrodoméstico';
      case 3:
        return 'Fotos adicionales';
      case 4:
        return 'Describe más detalles sobre la incidencia *';
      default:
        return '';
    }
  };

  const getTotalSteps = () => 4;

  const validateStep = (step: number) => {
    const newErrors: Errors = {};
    
    if (step === 1) {
      // Los campos cliente, telefono y direccion ya están rellenados y son readonly
      // Solo validar los campos que completa el cliente
      if (!formData.potenciaContratada.trim()) newErrors.potenciaContratada = 'La potencia contratada es requerida';
      if (!formData.fechaInstalacion.trim()) newErrors.fechaInstalacion = 'La fecha de instalación es requerida';
    }
    
    if (step === 2) {
      if (files.fotoGeneral.length === 0) newErrors.fotoGeneral = 'La foto general del electrodoméstico es requerida';
      if (files.fotoEtiqueta.length === 0) newErrors.fotoEtiqueta = 'La foto de la etiqueta del electrodoméstico es requerida';
    }
    
    if (step === 3) {
      if (files.fotoCuadroElectrico.length === 0) newErrors.fotoCuadroElectrico = 'La foto del cuadro eléctrico es requerida';
    }
    
    if (step === 4) {
      if (!formData.detalles.trim()) newErrors.detalles = 'Los detalles de la incidencia son requeridos';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, getTotalSteps()));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Usar la función uploadFiles importada de lib/upload.ts

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    setIsSubmitting(true);
    
    try {
      // Obtener recordId desde URL
      const urlParams = new URLSearchParams(window.location.search);
      const currentRecordId = urlParams.get('record');
      
      if (!currentRecordId || currentRecordId === 'undefined') {
        throw new Error('No se encontró un registro válido para actualizar');
      }

      // Upload files using the correct upload function
      const [fotoGeneralResults, fotoEtiquetaResults, fotoCuadroElectricoResults, fotoRotoResults] = await Promise.all([
        files.fotoGeneral.length > 0 ? uploadFiles(files.fotoGeneral) : [],
        files.fotoEtiqueta.length > 0 ? uploadFiles(files.fotoEtiqueta) : [],
        files.fotoCuadroElectrico.length > 0 ? uploadFiles(files.fotoCuadroElectrico) : [],
        files.fotoRoto.length > 0 ? uploadFiles(files.fotoRoto) : []
      ]);

      // Extract URLs from the upload results
      const fotoGeneralUrls = fotoGeneralResults.map(result => result.url);
      const fotoEtiquetaUrls = fotoEtiquetaResults.map(result => result.url);
      const fotoCuadroElectricoUrls = fotoCuadroElectricoResults.map(result => result.url);
      const fotoRotoUrls = fotoRotoResults.map(result => result.url);

      // Prepare submission data - solo enviar los campos que completa el cliente
      const submissionData = {
        recordId: currentRecordId,
        potenciaContratada: formData.potenciaContratada,
        fechaInstalacion: formData.fechaInstalacion,
        detalles: formData.detalles,
        fotoGeneral: fotoGeneralUrls,
        fotoEtiqueta: fotoEtiquetaUrls,
        fotoCuadroElectrico: fotoCuadroElectricoUrls,
        fotoRoto: fotoRotoUrls
      };

      // Submit form data - siempre usar POST para actualizar el registro existente
      const response = await fetch('/api/reparaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar el formulario');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      onError?.(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto">
        {/* Progress Steps Section */}
        <div className="mb-6">
          {/* Progress Bar */}
          <div className="flex items-center mb-6">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <motion.div
                animate={{
                  width: `${(currentStep / getTotalSteps()) * 100}%`
                }}
                transition={{ duration: 0.3 }}
                className="bg-[#008606] h-2 rounded-full"
              />
            </div>
            <span className="ml-3 text-sm font-medium text-gray-600">
              {currentStep} de {getTotalSteps()}
            </span>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {/* Step 1: Datos Generales */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
                {getStepTitle()}
              </h2>

              <div>
                <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="cliente"
                    value={formData.cliente}
                    readOnly={isEditMode}
                    className={cn(
                      "w-full px-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2 touch-manipulation",
                      isEditMode
                        ? "bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed focus:ring-0 focus:border-gray-200"
                        : errors.cliente 
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                          : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                    )}
                    placeholder="Nombre del cliente"
                    onChange={(e) => {
                      if (!isEditMode) {
                        setFormData(prev => ({ ...prev, cliente: e.target.value }));
                        if (errors.cliente) {
                          setErrors(prev => ({ ...prev, cliente: '' }));
                        }
                      }
                    }}
                  />
                </div>
                {errors.cliente && (
                  <p className="text-red-600 text-sm mt-1">{errors.cliente}</p>
                )}
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    id="telefono"
                    value={formData.telefono}
                    readOnly={true}
                    className={cn(
                      "w-full px-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2 touch-manipulation",
                      "bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed focus:ring-0 focus:border-gray-200"
                    )}
                    placeholder="Número de teléfono"
                  />
                </div>
                {!formData.telefono && (
                  <p className="text-amber-600 text-sm mt-1">Campo no disponible en el registro</p>
                )}
              </div>

              <div>
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="direccion"
                    value={formData.direccion}
                    readOnly={true}
                    className={cn(
                      "w-full px-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2 touch-manipulation",
                      "bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed focus:ring-0 focus:border-gray-200"
                    )}
                    placeholder="Dirección del cliente"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="potenciaContratada" className="block text-sm font-medium text-gray-700 mb-2">
                  Potencia contratada en la vivienda (kW) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="potenciaContratada"
                    value={formData.potenciaContratada}
                    className={cn(
                      "w-full px-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2 touch-manipulation",
                      errors.potenciaContratada 
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                        : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                    )}
                    placeholder="Ej: 5.75"
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, potenciaContratada: e.target.value }));
                      if (errors.potenciaContratada) {
                        setErrors(prev => ({ ...prev, potenciaContratada: '' }));
                      }
                    }}
                  />
                </div>
                {errors.potenciaContratada && (
                  <p className="text-red-600 text-sm mt-1">{errors.potenciaContratada}</p>
                )}
              </div>

              <div>
                <label htmlFor="fechaInstalacion" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de instalación aproximada *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="fechaInstalacion"
                    value={formData.fechaInstalacion}
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                    className={cn(
                      "w-full px-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2 touch-manipulation",
                      errors.fechaInstalacion 
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                        : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                    )}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Solo permitir números y barras
                      const cleanValue = value.replace(/[^\d]/g, '');
                      
                      // Formatear automáticamente DD/MM/YYYY
                      let formattedValue = '';
                      if (cleanValue.length >= 1) {
                        formattedValue = cleanValue.substring(0, 2);
                      }
                      if (cleanValue.length >= 3) {
                        formattedValue += '/' + cleanValue.substring(2, 4);
                      }
                      if (cleanValue.length >= 5) {
                        formattedValue += '/' + cleanValue.substring(4, 8);
                      }
                      
                      setFormData(prev => ({ ...prev, fechaInstalacion: formattedValue }));
                      if (errors.fechaInstalacion) {
                        setErrors(prev => ({ ...prev, fechaInstalacion: '' }));
                      }
                    }}
                  />
                </div>
                {errors.fechaInstalacion && (
                  <p className="text-red-600 text-sm mt-1">{errors.fechaInstalacion}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Fotos del Electrodoméstico (General + Etiqueta) */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
                {getStepTitle()}
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto general del electrodoméstico *
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Toca aquí para tomar una foto o seleccionar una imagen de tu galería
                </p>
                <FileUpload
                  label=""
                  onFileSelect={(files) => setFiles(prev => ({ ...prev, fotoGeneral: files }))}
                  accept={{
                    'image/*': [],
                  }}
                />
                {errors.fotoGeneral && (
                  <p className="text-red-600 text-sm mt-2">{errors.fotoGeneral}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto de la etiqueta del electrodoméstico *
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Busca la etiqueta con el número de serie y toma una foto clara
                </p>
                <FileUpload
                  label=""
                  onFileSelect={(files) => setFiles(prev => ({ ...prev, fotoEtiqueta: files }))}
                  accept={{
                    'image/*': [],
                  }}
                />
                {errors.fotoEtiqueta && (
                  <p className="text-red-600 text-sm mt-2">{errors.fotoEtiqueta}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Fotos Adicionales (Cuadro Eléctrico + Roto) */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
                {getStepTitle()}
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto del cuadro eléctrico del electrodoméstico con la puerta abierta *
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Abre la puerta del cuadro eléctrico y toma una foto clara del interior
                </p>
                <FileUpload
                  label=""
                  onFileSelect={(files) => setFiles(prev => ({ ...prev, fotoCuadroElectrico: files }))}
                  accept={{
                    'image/*': [],
                  }}
                />
                {errors.fotoCuadroElectrico && (
                  <p className="text-red-600 text-sm mt-2">{errors.fotoCuadroElectrico}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto de algo roto físicamente (Opcional)
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Si hay algún componente roto físicamente (soporte, cables, carcasa), adjunta una foto enfocando la parte dañada
                </p>
                <FileUpload
                  label=""
                  onFileSelect={(files) => setFiles(prev => ({ ...prev, fotoRoto: files }))}
                  accept={{
                    'image/*': [],
                  }}
                />
                {errors.fotoRoto && (
                  <p className="text-red-600 text-sm mt-2">{errors.fotoRoto}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 4: Detalles */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
                {getStepTitle()}
              </h2>

              <div>
                <label htmlFor="detalles" className="sr-only">
                  Describe más detalles sobre la incidencia *
                </label>
                <textarea
                  id="detalles"
                  value={formData.detalles}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, detalles: e.target.value }));
                    if (errors.detalles) {
                      setErrors(prev => ({ ...prev, detalles: '' }));
                    }
                  }}
                  rows={5}
                  className={cn(
                    "w-full px-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md resize-none focus:ring-2",
                    errors.detalles 
                      ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                      : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                  )}
                  placeholder=""
                />
                {errors.detalles && (
                  <p className="text-red-600 text-sm mt-1">{errors.detalles}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex flex-row items-center justify-between gap-3 flex-wrap mt-8 pt-6 border-t border-gray-100 bg-white sticky bottom-0 pb-4 sm:pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
            className={cn(
              "flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium transition-all duration-200 touch-manipulation",
              currentStep === 1 || isSubmitting
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100 active:scale-95"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
            Atrás
          </button>

          <button
            type="button"
            onClick={currentStep === 4 ? handleSubmit : nextStep}
            disabled={isSubmitting}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-[#008606] hover:bg-[#008606]/90 active:scale-95 text-white font-semibold px-6 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : currentStep === 4 ? (
              <>
                Enviar
              </>
            ) : (
              <>
                Continuar
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}