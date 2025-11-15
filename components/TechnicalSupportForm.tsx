"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/ui/file-upload';
import { uploadFiles } from '@/lib/upload';
import { 
  Loader2, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';

const steps = [
  { id: 1, title: 'Datos Generales' },
  { id: 2, title: 'Fotos del Punto de Recarga' },
  { id: 3, title: 'Fotos Adicionales' },
  { id: 4, title: 'Detalles' },
  { id: 5, title: 'Información Técnica' },
];

const problemOptions = [
  'Cargador no carga',
  'Cargador no enciende',
  'Soporte roto físicamente',
  'Manguera roto físicamente',
  'Cargador roto físicamente',
  'Otro'
];

const physicalDamageOptions = [
  'Soporte roto físicamente',
  'Manguera roto físicamente',
  'Cargador roto físicamente'
];

interface TechnicalSupportFormProps {
  onComplete: () => void;
  onError: (error: string) => void;
}

// Funciones de utilidad para conversión de fechas
const convertDateFromAirtable = (airtableDate: string): string => {
  if (!airtableDate) return '';
  
  // Si ya está en formato DD/MM/YYYY, devolverlo tal como está
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(airtableDate)) {
    return airtableDate;
  }
  
  // Si está en formato YYYY-MM-DD (formato ISO), convertir a DD/MM/YYYY
  const isoMatch = airtableDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year}`;
  }
  
  return airtableDate;
};

const convertDateToAirtable = (displayDate: string): string => {
  if (!displayDate) return '';
  
  // Si está en formato DD/MM/YYYY, convertir a YYYY-MM-DD
  const ddmmyyyyMatch = displayDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month}-${day}`;
  }
  
  return displayDate;
};

export function TechnicalSupportForm({ onComplete, onError }: TechnicalSupportFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordId, setRecordId] = useState<string>('');
  const [expediente, setExpediente] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingData, setExistingData] = useState<any>(null);

  const getTotalSteps = () => {
    return 5;
  };
  
  const [formData, setFormData] = useState({
    cliente: '',
    telefono: '',
    direccion: '',
    potenciaContratada: '',
    fechaInstalacion: '',
    detalles: '',
  });
  
  const [files, setFiles] = useState({
    fotoGeneral: [] as File[],
    fotoEtiqueta: [] as File[],
    fotoCuadroElectrico: [] as File[],
    fotoRoto: [] as File[],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos del expediente si existe en la URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    const recordParam = urlParams.get('record');
    const expedienteParam = urlParams.get('expediente');
    
    // Priorizar id, luego record, luego expediente para compatibilidad
    if (idParam) {
      setRecordId(idParam);
      loadRecordData(idParam, 'record');
    } else if (recordParam) {
      setRecordId(recordParam);
      loadRecordData(recordParam, 'record');
    } else if (expedienteParam) {
      setExpediente(expedienteParam);
      loadRecordData(expedienteParam, 'expediente');
    }
  }, []);

  const loadRecordData = async (id: string, paramType: 'record' | 'expediente') => {
    try {
      const queryParam = paramType === 'record' ? `record=${id}` : `expediente=${id}`;
      const response = await fetch(`/api/expediente?${queryParam}`);
      
      if (response.ok) {
        const data = await response.json();
        setIsEditMode(true);
        setExistingData(data);
        
        // Prellenar formulario con datos existentes
        setFormData(prev => ({
          ...prev,
          cliente: data.cliente || '',
          telefono: data.telefono || '',
          direccion: data.direccion || '',
          potenciaContratada: data.potenciaContratada || '',
          fechaInstalacion: convertDateFromAirtable(data.fechaInstalacion || ''),
          detalles: data.detalles || '',
        }));

        // Prellenar archivos existentes si los hay
        // Nota: Los archivos de Airtable se mostrarían como links, no como File objects
        // Para una implementación completa, necesitarías convertir URLs a File objects
      } else if (response.status === 404) {
        onError(`Registro ${id} no encontrado`);
      }
    } catch (error) {
      console.error('Error cargando registro:', error);
      onError('Error al cargar los datos del registro');
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.cliente.trim()) {
          newErrors.cliente = 'El nombre del cliente es requerido';
        }
        if (!formData.telefono.trim()) {
          newErrors.telefono = 'El teléfono es requerido';
        }
        if (!formData.direccion.trim()) {
          newErrors.direccion = 'La dirección es requerida';
        }
        break;
        
      case 2:
        if (files.fotoGeneral.length === 0) {
          newErrors.fotoGeneral = 'Por favor, adjunta una foto general del punto de recarga';
        }
        if (files.fotoEtiqueta.length === 0) {
          newErrors.fotoEtiqueta = 'Por favor, adjunta una foto de la etiqueta del punto de recarga';
        }
        break;
        
      case 3:
        if (files.fotoCuadroElectrico.length === 0) {
          newErrors.fotoCuadroElectrico = 'Por favor, adjunta una foto del cuadro eléctrico con la puerta abierta';
        }
        // fotoRoto es opcional, no se valida
        break;
        
      case 4:
        if (!formData.detalles.trim()) {
          newErrors.detalles = 'Por favor, explica en detalles la incidencia';
        }
        break;
        
      case 5:
        if (!formData.potenciaContratada.trim()) {
          newErrors.potenciaContratada = 'La potencia contratada es requerida';
        }
        if (!formData.fechaInstalacion.trim()) {
          newErrors.fechaInstalacion = 'La fecha de instalación es requerida';
        } else {
          // Validar formato DD/MM/YYYY
          const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
          const match = formData.fechaInstalacion.match(dateRegex);
          
          if (!match) {
            newErrors.fechaInstalacion = 'Formato de fecha inválido. Use DD/MM/YYYY';
          } else {
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10);
            const year = parseInt(match[3], 10);
            
            // Validar rangos básicos
            if (day < 1 || day > 31) {
              newErrors.fechaInstalacion = 'Día inválido';
            } else if (month < 1 || month > 12) {
              newErrors.fechaInstalacion = 'Mes inválido';
            } else if (year < 1900 || year > new Date().getFullYear()) {
              newErrors.fechaInstalacion = 'Año inválido';
            }
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 5) {
        handleSubmit();
        return;
      }
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (currentStep === 5 && !validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    
    try {
      // Upload files
      let fotoGeneralUploads: any[] = [];
      let fotoEtiquetaUploads: any[] = [];
      let fotoCuadroElectricoUploads: any[] = [];
      let fotoRotoUploads: any[] = [];
      
      if (files.fotoGeneral.length > 0) {
        fotoGeneralUploads = await uploadFiles(files.fotoGeneral);
      }
      if (files.fotoEtiqueta.length > 0) {
        fotoEtiquetaUploads = await uploadFiles(files.fotoEtiqueta);
      }
      if (files.fotoCuadroElectrico.length > 0) {
        fotoCuadroElectricoUploads = await uploadFiles(files.fotoCuadroElectrico);
      }
      if (files.fotoRoto.length > 0) {
        fotoRotoUploads = await uploadFiles(files.fotoRoto);
      }

      const supportData = {
        "Cliente": formData.cliente,
        "Teléfono": formData.telefono,
        "Dirección": formData.direccion,
        "Potencia contratada en kW": formData.potenciaContratada,
        "Fecha instalación": convertDateToAirtable(formData.fechaInstalacion),
        "Foto general": fotoGeneralUploads,
        "Foto etiqueta": fotoEtiquetaUploads,
        "Foto cuadro": fotoCuadroElectricoUploads,
        "Foto roto": fotoRotoUploads.length > 0 ? fotoRotoUploads : undefined,
        "Detalles": formData.detalles,
      };

      // Decidir si crear nuevo registro o actualizar existente
      if (isEditMode && (recordId || expediente)) {
        // Actualizar registro existente
        const queryParam = recordId ? `record=${recordId}` : `expediente=${expediente}`;
        const response = await fetch(`/api/expediente?${queryParam}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(supportData),
        });

        if (!response.ok) {
          throw new Error('Error al actualizar el registro');
        }

        console.log('Registro actualizado:', supportData);
      } else {
        // Crear nuevo registro (implementación futura si es necesario)
        const response = await fetch('/api/technical-support', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(supportData),
        });

        if (!response.ok) {
          throw new Error('Error al crear la solicitud');
        }

        console.log('Nueva solicitud creada:', supportData);
      }
      
      onComplete();

    } catch (error: any) {
      const msg = typeof error?.message === 'string' ? error.message : 'Error al enviar la solicitud. Inténtalo de nuevo.';
      onError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Datos Generales';
      case 2: return 'Fotos del Punto de Recarga';
      case 3: return 'Fotos Adicionales';
      case 4: return 'Explica en detalles la incidencia';
      case 5: return 'Información Técnica del Punto de Recarga';
      default: return '';
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
                    readOnly={isEditMode}
                    className={cn(
                      "w-full px-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2 touch-manipulation",
                      isEditMode
                        ? "bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed focus:ring-0 focus:border-gray-200"
                        : errors.telefono 
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                          : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                    )}
                    placeholder="Número de teléfono"
                    onChange={(e) => {
                      if (!isEditMode) {
                        setFormData(prev => ({ ...prev, telefono: e.target.value }));
                        if (errors.telefono) {
                          setErrors(prev => ({ ...prev, telefono: '' }));
                        }
                      }
                    }}
                  />
                </div>
                {errors.telefono && (
                  <p className="text-red-600 text-sm mt-1">{errors.telefono}</p>
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
                    className={cn(
                      "w-full px-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2 touch-manipulation",
                      errors.direccion 
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                        : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                    )}
                    placeholder="Dirección del cliente"
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, direccion: e.target.value }));
                      if (errors.direccion) {
                        setErrors(prev => ({ ...prev, direccion: '' }));
                      }
                    }}
                  />
                </div>
                {errors.direccion && (
                  <p className="text-red-600 text-sm mt-1">{errors.direccion}</p>
                )}
              </div>


            </motion.div>
          )}

          {/* Step 2: Fotos del Punto de Recarga (General + Etiqueta) */}
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
                  Foto general del punto de recarga *
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
                  maxFiles={5}
                />
                {errors.fotoGeneral && (
                  <p className="text-red-600 text-sm mt-2">{errors.fotoGeneral}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto de la etiqueta del punto de recarga *
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
                  maxFiles={5}
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
                  Foto del cuadro eléctrico del cargador *
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
                  maxFiles={5}
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
                  Si hay algún componente roto físicamente (soporte, manguera, cargador), adjunta una foto enfocando la parte dañada
                </p>
                <FileUpload
                  label=""
                  onFileSelect={(files) => setFiles(prev => ({ ...prev, fotoRoto: files }))}
                  accept={{
                    'image/*': [],
                  }}
                  maxFiles={5}
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

          {/* Step 5: Información Técnica */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
                {getStepTitle()}
              </h2>

              <div>
                <label htmlFor="fechaInstalacion" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de instalación del punto de recarga *
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

              <div>
                <label htmlFor="potenciaContratada" className="block text-sm font-medium text-gray-700 mb-2">
                  Potencia contratada de su vivienda en kW *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="potenciaContratada"
                    value={formData.potenciaContratada}
                    className={cn(
                      "w-full px-4 py-4 pr-12 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2 touch-manipulation",
                      errors.potenciaContratada 
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                        : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                    )}
                    placeholder="5,75"
                    onChange={(e) => {
                      let value = e.target.value;
                      // Solo permitir números, comas y puntos
                      value = value.replace(/[^\d,\.]/g, '');
                      // Reemplazar punto por coma
                      value = value.replace(/\./g, ',');
                      // Solo permitir una coma
                      const parts = value.split(',');
                      if (parts.length > 2) {
                        value = parts[0] + ',' + parts.slice(1).join('');
                      }
                      // Limitar a 2 decimales
                      if (parts[1] && parts[1].length > 2) {
                        value = parts[0] + ',' + parts[1].substring(0, 2);
                      }
                      
                      setFormData(prev => ({ ...prev, potenciaContratada: value }));
                      if (errors.potenciaContratada) {
                        setErrors(prev => ({ ...prev, potenciaContratada: '' }));
                      }
                    }}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <span className="text-gray-500 text-base">kW</span>
                  </div>
                </div>
                {errors.potenciaContratada && (
                  <p className="text-red-600 text-sm mt-1">{errors.potenciaContratada}</p>
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
            onClick={currentStep === 5 ? handleSubmit : nextStep}
            disabled={isSubmitting}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-[#008606] hover:bg-[#008606]/90 active:scale-95 text-white font-semibold px-6 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : currentStep === 5 ? (
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
