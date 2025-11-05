"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, type ClientFormData } from '@/lib/validations';
import { FileUpload } from '@/components/ui/file-upload';
import { uploadFiles } from '@/lib/upload';
import { useToast } from '@/hooks/useToastClient';
import { Toast } from '@/components/ui/toast';
import { ChevronLeft, ChevronRight, CheckCircle, Building2, Globe, Upload, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const steps = [
  { id: 1, title: 'Datos Generales', icon: Building2 },
  { id: 2, title: 'Presencia Digital', icon: Globe },
  { id: 3, title: 'Archivos', icon: Upload },
  { id: 4, title: 'Seguridad', icon: Shield },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [catalogFiles, setCatalogFiles] = useState<File[]>([]);
  const [hasGoogleBusiness, setHasGoogleBusiness] = useState<string>('');
  const { toast, showToast, hideToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
    reset,
    watch,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    mode: 'onChange',
  });

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const getFieldsForStep = (step: number): (keyof ClientFormData)[] => {
    const watchGoogleBusiness = watch('¿Tienen ficha en Google Business?');
    
    switch (step) {
      case 1:
        return ['Nombre de la clínica', 'Email', 'Teléfono', 'Dirección', 'Horario de atención'];
      case 2:
        const fieldsStep2: (keyof ClientFormData)[] = ['¿Tienen más de una sede?', '¿Tienen ficha en Google Business?', 'Enlace a su web', '¿Qué calendario usan?', '¿Cuántos calendario tienen?'];
        
        // Solo agregar el campo de Google Business URL si respondió "Sí"
        if (watchGoogleBusiness === 'Sí') {
          fieldsStep2.splice(2, 0, 'Enlace a ficha de Google Business');
        }
        
        return fieldsStep2;
      case 3:
        return [];
      case 4:
        return ['Password'];
      default:
        return [];
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    console.log('Formulario enviado con datos:', data);
    
    if (logoFiles.length === 0) {
      showToast('El logo es requerido', 'error');
      return;
    }
    if (catalogFiles.length === 0) {
      showToast('El catálogo es requerido', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Iniciando carga de archivos...');
      // Upload files
      const [logoUploads, catalogUploads] = await Promise.all([
        uploadFiles(logoFiles),
        uploadFiles(catalogFiles),
      ]);
      
      console.log('Archivos cargados:', { logoUploads, catalogUploads });

      // Prepare data for Airtable
      const clientData: Record<string, any> = {
        ...data,
        Logo: logoUploads,
        Catálogo: catalogUploads,
        Password: data.Password,
      };
      
      console.log('Datos preparados para enviar:', clientData);

      // Submit to API
      console.log('Enviando datos a /api/clientes...');
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });

      console.log('Respuesta recibida:', response.status, response.statusText);

      if (!response.ok) {
        try {
          const err = await response.json();
          console.error('Error de la API:', err);
          showToast(typeof err?.error === 'string' ? err.error : 'No se pudo crear el cliente', 'error');
        } catch (parseError) {
          console.error('Error al parsear respuesta de error:', parseError);
          showToast('No se pudo crear el cliente', 'error');
        }
        return;
      }

      console.log('Cliente creado exitosamente');
      setIsCompleted(true);
      showToast('¡Datos de onboarding enviados exitosamente!', 'success');
    } catch (error: any) {
      console.error('Error completo:', error);
      showToast(typeof error?.message === 'string' ? error.message : 'Error al enviar los datos. Inténtalo de nuevo.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    reset();
    setCurrentStep(1);
    setIsCompleted(false);
    setLogoFiles([]);
    setCatalogFiles([]);
    window.location.href = '/';
  };

  if (isCompleted) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-t from-[#0059F1] to-black flex items-center justify-center p-4">
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
              ¡Gracias!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-6"
            >
              Hemos recibido tus datos de onboarding exitosamente.
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={handleBackToHome}
              className="bg-[#0059F1] hover:bg-[#0059F1]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Volver al Inicio
            </motion.button>
          </motion.div>
        </div>
  <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-t from-[#0059F1] to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="flex justify-center mb-4">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={120}
                  height={40}
                  className="h-12 w-auto"
                />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Onboarding de Cliente</h1>
              <p className="text-gray-300">Completa la información para comenzar</p>
            </motion.div>

            {/* Progress Steps */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center">
                    <motion.div
                      animate={{
                        backgroundColor: currentStep >= step.id ? '#0059F1' : '#374151',
                        scale: currentStep === step.id ? 1.1 : 1,
                      }}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mb-2 shadow-lg"
                    >
                      <step.icon className="w-5 h-5" />
                    </motion.div>
                    <span className="text-xs text-gray-300 text-center max-w-20">
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20"
            >
              <form onSubmit={handleSubmit(onSubmit)}>
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
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Datos Generales</h2>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre de la clínica *
                        </label>
                        <input
                          {...register('Nombre de la clínica')}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                            errors['Nombre de la clínica'] 
                              ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                              : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                          )}
                          placeholder="Ingresa el nombre de la clínica"
                        />
                        {errors['Nombre de la clínica'] && (
                          <p className="text-red-600 text-sm mt-1">{errors['Nombre de la clínica']?.message}</p>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            {...register('Email')}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                              errors.Email 
                                ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                                : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                            )}
                            placeholder="correo@ejemplo.com"
                          />
                          {errors.Email && (
                            <p className="text-red-600 text-sm mt-1">{errors.Email.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Teléfono *
                          </label>
                          <input
                            {...register('Teléfono')}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                              errors.Teléfono 
                                ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                                : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                            )}
                            placeholder="+1 234 567 8900"
                          />
                          {errors.Teléfono && (
                            <p className="text-red-600 text-sm mt-1">{errors.Teléfono.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dirección *
                        </label>
                        <input
                          {...register('Dirección')}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                            errors.Dirección 
                              ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                              : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                          )}
                          placeholder="Calle, Ciudad, País"
                        />
                        {errors.Dirección && (
                          <p className="text-red-600 text-sm mt-1">{errors.Dirección.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horario de atención *
                        </label>
                        <textarea
                          {...register('Horario de atención')}
                          rows={3}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                            errors['Horario de atención'] 
                              ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                              : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                          )}
                          placeholder="Ej: Lunes a Viernes 9:00 - 18:00"
                        />
                        {errors['Horario de atención'] && (
                          <p className="text-red-600 text-sm mt-1">{errors['Horario de atención']?.message}</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Presencia Digital */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="space-y-6"
                    >
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Presencia Digital</h2>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ¿Tienen más de una sede? *
                          </label>
                          <select
                            {...register('¿Tienen más de una sede?')}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                              errors['¿Tienen más de una sede?'] 
                                ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                                : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                            )}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Sí">Sí</option>
                            <option value="No">No</option>
                          </select>
                          {errors['¿Tienen más de una sede?'] && (
                            <p className="text-red-600 text-sm mt-1">{errors['¿Tienen más de una sede?']?.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ¿Tienen ficha en Google Business? *
                          </label>
                          <select
                            {...register('¿Tienen ficha en Google Business?')}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                              errors['¿Tienen ficha en Google Business?'] 
                                ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                                : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                            )}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Sí">Sí</option>
                            <option value="No">No</option>
                          </select>
                          {errors['¿Tienen ficha en Google Business?'] && (
                            <p className="text-red-600 text-sm mt-1">{errors['¿Tienen ficha en Google Business?']?.message}</p>
                          )}
                        </div>
                      </div>

                      {watch('¿Tienen ficha en Google Business?') === 'Sí' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enlace a ficha de Google Business *
                          </label>
                          <input
                            type="url"
                            {...register('Enlace a ficha de Google Business')}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                              errors['Enlace a ficha de Google Business'] 
                                ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                                : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                            )}
                            placeholder="https://business.google.com/..."
                          />
                          {errors['Enlace a ficha de Google Business'] && (
                            <p className="text-red-600 text-sm mt-1">{errors['Enlace a ficha de Google Business']?.message}</p>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enlace a su web *
                        </label>
                        <input
                          type="url"
                          {...register('Enlace a su web')}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                            errors['Enlace a su web'] 
                              ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                              : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                          )}
                          placeholder="https://www.ejemplo.com"
                        />
                        {errors['Enlace a su web'] && (
                          <p className="text-red-600 text-sm mt-1">{errors['Enlace a su web']?.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ¿Qué calendario usan? *
                        </label>
                        <input
                          {...register('¿Qué calendario usan?')}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                            errors['¿Qué calendario usan?'] 
                              ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                              : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                          )}
                          placeholder="Ej: Google Calendar, Outlook, agenda física, software específico..."
                        />
                        {errors['¿Qué calendario usan?'] && (
                          <p className="text-red-600 text-sm mt-1">{errors['¿Qué calendario usan?']?.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ¿Cuántos calendario tienen? *
                        </label>
                        <textarea
                          {...register('¿Cuántos calendario tienen?')}
                          rows={4}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                            errors['¿Cuántos calendario tienen?'] 
                              ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                              : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                          )}
                          placeholder="Ej: 3 calendarios - uno para María Juárez odontóloga, otro para blanqueamiento con la dentista Juana López, y uno para cirugía con el Dr. Rodríguez. Cada uno maneja sus propios horarios y disponibilidad..."
                        />
                        {errors['¿Cuántos calendario tienen?'] && (
                          <p className="text-red-600 text-sm mt-1">{errors['¿Cuántos calendario tienen?']?.message}</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Archivos */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="space-y-6"
                    >
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Archivos</h2>
                      
                      <FileUpload
                        label="Logo"
                        required
                        onFileSelect={setLogoFiles}
                        accept={{
                          'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
                        }}
                        maxFiles={1}
                        maxSize={5 * 1024 * 1024}
                      />

                      <FileUpload
                        label="Catálogo"
                        required
                        onFileSelect={setCatalogFiles}
                        accept={{
                          'application/pdf': ['.pdf'],
                          'image/*': ['.png', '.jpg', '.jpeg'],
                        }}
                        maxFiles={1}
                        maxSize={10 * 1024 * 1024}
                      />
                    </motion.div>
                  )}

                  {/* Step 4: Seguridad */}
                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="space-y-6"
                    >
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Escribe tu contraseña para el portal del cliente</h2>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contraseña *
                        </label>
                        <input
                          type="password"
                          {...register('Password')}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                            errors.Password 
                              ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                              : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                          )}
                          placeholder="Ingresa tu contraseña"
                        />
                        {errors.Password && (
                          <p className="text-red-600 text-sm mt-1">{errors.Password.message}</p>
                        )}
                        <p className="text-gray-500 text-sm mt-1">
                          Esta contraseña será usada para acceder al portal del cliente.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1 || isSubmitting}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200",
                      currentStep === 1 || isSubmitting
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Atrás
                  </button>

          {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={nextStep}
            disabled={isSubmitting}
                      className="flex items-center gap-2 bg-[#0059F1] hover:bg-[#0059F1]/90 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Avanzar
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      onClick={() => console.log('Botón enviar clickeado')}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-300 disabled:to-emerald-300 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Enviar
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
      
  <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </>
  );
}