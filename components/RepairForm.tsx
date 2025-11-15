"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/ui/file-upload';
import { uploadFiles } from '@/lib/upload';
import { 
  Loader2, 
  User, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle
} from 'lucide-react';
import { serviciosOptions, cuadroElectricoOptions } from '@/lib/repair-options';

const steps = [
  { id: 1, title: 'Datos Generales' },
  { id: 2, title: 'Reparación' },
  { id: 3, title: 'Documentación' },
];

interface RepairFormProps {
  onRepairComplete: () => void;
  onRepairError: (error: string) => void;
}

export function RepairForm({ 
  onRepairComplete,
  onRepairError
}: RepairFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recordId, setRecordId] = useState<string>('');
  const [expediente, setExpediente] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingAttachments, setExistingAttachments] = useState({
    factura: [] as any[],
    foto: [] as any[],
    fotoEtiqueta: [] as any[],
  });
  
  const [formData, setFormData] = useState({
    // Step 1: Datos Generales
    cliente: '',
    direccion: '',
    tecnico: '',

    // Step 2: Reparación
    resultado: '',
    reparacion: '', // Single option
    cuadroElectrico: '', // Single option
    detalles: '', // Campo que siempre aparece
  });
  
  const [files, setFiles] = useState({
    factura: [] as File[],
    foto: [] as File[],
    fotoEtiqueta: [] as File[],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const recordParam = params.get('id');
    const expedienteParam = params.get('expediente');

    if (recordParam) {
      setRecordId(recordParam);
      setIsLoading(true);
      loadRecordData(recordParam);
    } else if (expedienteParam) {
      setExpediente(expedienteParam);
      setIsLoading(true);
      loadExpedienteData(expedienteParam);
    }
  }, []);

  const loadRecordData = async (record: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/repairs?record=${encodeURIComponent(record)}`);

      if (response.ok) {
        const data = await response.json();
        setIsEditMode(true);
        const isRepaired = data.resultado === 'Reparado';
        setFormData(prev => ({
          ...prev,
          cliente: data.cliente || '',
          direccion: data.direccion || '',
          tecnico: data.tecnico || '',
          resultado: data.resultado || '',
          reparacion: isRepaired ? data.reparacion || '' : '',
          cuadroElectrico: isRepaired ? data.cuadroElectrico || '' : '',
          detalles: data.detalles || data.problema || '', // Usar detalles o problema como fallback
        }));
        setExistingAttachments({
          factura: Array.isArray(data.factura) ? data.factura : [],
          foto: Array.isArray(data.foto) ? data.foto : [],
          fotoEtiqueta: Array.isArray(data.fotoEtiqueta) ? data.fotoEtiqueta : [],
        });
      } else if (response.status === 404) {
        onRepairError(`Registro ${record} no encontrado`);
      } else {
        onRepairError('No se pudo cargar la información de la reparación');
      }
    } catch (error) {
      console.error('Error cargando registro:', error);
      onRepairError('Error al cargar los datos del registro');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExpedienteData = async (expedienteId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/repairs?expediente=${encodeURIComponent(expedienteId)}`);

      if (response.ok) {
        const data = await response.json();
        setIsEditMode(true);
        setRecordId(data.id); // Guardar el recordId para futuras actualizaciones
        const isRepaired = data.resultado === 'Reparado';
        setFormData(prev => ({
          ...prev,
          cliente: data.cliente || '',
          direccion: data.direccion || '',
          tecnico: data.tecnico || '',
          resultado: data.resultado || '',
          reparacion: isRepaired ? data.reparacion || '' : '',
          cuadroElectrico: isRepaired ? data.cuadroElectrico || '' : '',
          detalles: data.detalles || data.problema || '', // Usar detalles o problema como fallback
        }));
        setExistingAttachments({
          factura: Array.isArray(data.factura) ? data.factura : [],
          foto: Array.isArray(data.foto) ? data.foto : [],
          fotoEtiqueta: Array.isArray(data.fotoEtiqueta) ? data.fotoEtiqueta : [],
        });
      } else if (response.status === 404) {
        onRepairError(`Expediente ${expedienteId} no encontrado`);
      } else {
        onRepairError('No se pudo cargar la información de la reparación');
      }
    } catch (error) {
      console.error('Error cargando expediente:', error);
      onRepairError('Error al cargar los datos del expediente');
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.cliente.trim()) {
          newErrors.cliente = 'El nombre del cliente es requerido';
        }
        if (!formData.direccion.trim()) {
          newErrors.direccion = 'La dirección es requerida';
        }
        if (!formData.tecnico.trim()) {
          newErrors.tecnico = 'El técnico es requerido';
        }
        break;
        
      case 2:
        if (!formData.resultado.trim()) {
          newErrors.resultado = 'Indica si se ha conseguido reparar';
        }
        if (formData.resultado === 'Reparado') {
          if (!formData.reparacion.trim()) {
            newErrors.reparacion = 'Selecciona el tipo de reparación';
          }
          if (formData.reparacion === 'Reparar el cuadro eléctrico' && !formData.cuadroElectrico.trim()) {
            newErrors.cuadroElectrico = 'Selecciona qué se reparó en el cuadro eléctrico';
          }
        }
        // El campo detalles ahora es siempre requerido
        if (!formData.detalles.trim()) {
          newErrors.detalles = 'Describe los detalles de la reparación';
        }
        break;
        
      case 3:
        if (files.foto.length === 0 && existingAttachments.foto.length === 0) {
          newErrors.foto = 'Adjunta al menos una foto del punto de recarga después de la intervención';
        }
        // Si se seleccionó "Sustituir el punto de recarga", la foto de la etiqueta es obligatoria
        if (formData.reparacion === 'Sustituir el punto de recarga') {
          if (files.fotoEtiqueta.length === 0 && existingAttachments.fotoEtiqueta.length === 0) {
            newErrors.fotoEtiqueta = 'La foto de la etiqueta del nuevo equipo es obligatoria';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    
    try {
      // Upload files if any
      let facturaUploads: any[] = [];
      let fotoUploads: any[] = [];
      let fotoEtiquetaUploads: any[] = [];
      
      try {
        if (files.factura.length > 0) {
          facturaUploads = await uploadFiles(files.factura);
        }
        if (files.foto.length > 0) {
          fotoUploads = await uploadFiles(files.foto);
        }
        if (files.fotoEtiqueta.length > 0) {
          fotoEtiquetaUploads = await uploadFiles(files.fotoEtiqueta);
        }
      } catch (uploadError: any) {
        // Show specific error message from upload
        const errorMsg = typeof uploadError?.message === 'string' 
          ? uploadError.message 
          : 'Error al procesar los archivos. Verifica que sean válidos.';
        onRepairError(errorMsg);
        setIsSubmitting(false);
        return;
      }

      const isRepaired = formData.resultado === 'Reparado';
      const repairData: Record<string, any> = {
        Resultado: formData.resultado,
        Reparación: isRepaired ? formData.reparacion : undefined,
        "Cuadro eléctrico": isRepaired && formData.reparacion === 'Reparar el cuadro eléctrico'
          ? formData.cuadroElectrico || undefined
          : undefined,
        Detalles: formData.detalles, // Siempre enviamos los detalles
        Técnico: formData.tecnico,
        Cliente: formData.cliente,
        Dirección: formData.direccion,
        Factura: facturaUploads.length > 0 ? facturaUploads : undefined,
        Foto: fotoUploads.length > 0 ? fotoUploads : undefined,
        "Foto de la etiqueta": fotoEtiquetaUploads.length > 0 ? fotoEtiquetaUploads : undefined,
      };

      // When editing, clear fields that don't apply based on result
      // Use null instead of empty string for select fields to avoid Airtable errors
      if (!isRepaired && isEditMode) {
        repairData['Reparación'] = null;
        repairData['Cuadro eléctrico'] = null;
      }

      if (isRepaired && isEditMode) {
        // Ya no necesitamos limpiar el campo problema, porque ahora usamos detalles siempre
        if (formData.reparacion !== 'Reparar el cuadro eléctrico') {
          repairData['Cuadro eléctrico'] = null;
        }
      }

      const isUpdate = isEditMode && (Boolean(recordId) || Boolean(expediente));
      if (!isUpdate && expediente) {
        (repairData as any).Expediente = expediente;
      }
      
      // Priorizar record ID sobre expediente
      const endpoint = isUpdate
        ? recordId 
          ? `/api/repairs?record=${encodeURIComponent(recordId)}`
          : `/api/repairs?expediente=${encodeURIComponent(expediente)}`
        : '/api/repairs';

      const response = await fetch(endpoint, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repairData),
      });

      if (!response.ok) {
        try {
          const data = await response.json();
          onRepairError(typeof data?.error === 'string' ? data.error : 'Error al crear la reparación');
        } catch {
          onRepairError('Error al crear la reparación');
        }
        return;
      }

      onRepairComplete();
    } catch (error: any) {
      const msg = typeof error?.message === 'string' ? error.message : 'Algo salió mal. Inténtalo de nuevo.';
      onRepairError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleResultadoChange = (resultado: 'Reparado' | 'No reparado') => {
    setFormData(prev => ({
      ...prev,
      resultado,
      // Ya no limpiamos los detalles, se mantienen siempre
      reparacion: resultado === 'No reparado' ? '' : prev.reparacion,
      cuadroElectrico: resultado === 'No reparado' ? '' : prev.cuadroElectrico,
    }));

    setErrors(prev => ({
      ...prev,
      resultado: '',
      ...(resultado === 'Reparado'
        ? { detalles: '' }
        : { reparacion: '', cuadroElectrico: '' }),
    }));
  };

  const handleReparacionChange = (reparacion: string) => {
    setFormData(prev => ({
      ...prev,
      reparacion,
      // Si no es "Reparar el cuadro eléctrico", limpiar la selección del cuadro
      cuadroElectrico: reparacion === 'Reparar el cuadro eléctrico' ? prev.cuadroElectrico : ''
    }));
    
    if (errors.reparacion) {
      setErrors(prev => ({ ...prev, reparacion: '' }));
    }
    if (errors.cuadroElectrico && reparacion !== 'Reparar el cuadro eléctrico') {
      setErrors(prev => ({ ...prev, cuadroElectrico: '' }));
    }
  };

  const handleCuadroElectricoChange = (opcion: string) => {
    setFormData(prev => ({
      ...prev,
      cuadroElectrico: opcion
    }));

    if (errors.cuadroElectrico) {
      setErrors(prev => ({ ...prev, cuadroElectrico: '' }));
    }
  };

  const handleFileChange = (field: 'foto' | 'factura' | 'fotoEtiqueta', selectedFiles: File[]) => {
    setFiles(prev => ({ ...prev, [field]: selectedFiles }));
    setExistingAttachments(prev => ({
      ...prev,
      [field]: selectedFiles.length > 0 ? [] : prev[field],
    }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#008606]" />
        <span className="ml-3 text-sm text-gray-600">Cargando información del expediente...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Form Content */}
        <div>
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                Datos Generales
              </h2>

              <div>
                <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="cliente"
                    value={formData.cliente}
                    onChange={(e) => handleInputChange('cliente', e.target.value)}
                    readOnly={isEditMode}
                    className={cn(
                      "w-full pl-10 pr-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2 touch-manipulation",
                      isEditMode
                        ? "bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed focus:ring-0 focus:border-gray-200"
                        : errors.cliente 
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                          : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                    )}
                    placeholder="Nombre del cliente"
                  />
                </div>
                {errors.cliente && (
                  <p className="text-red-600 text-sm mt-1">{errors.cliente}</p>
                )}
              </div>

              <div>
                <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => handleInputChange('direccion', e.target.value)}
                    readOnly={isEditMode}
                    className={cn(
                      "w-full pl-10 pr-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                      isEditMode
                        ? "bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed focus:ring-0 focus:border-gray-200"
                        : errors.direccion 
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                          : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                    )}
                    placeholder="Dirección del cliente"
                  />
                </div>
                {errors.direccion && (
                  <p className="text-red-600 text-sm mt-1">{errors.direccion}</p>
                )}
              </div>

              <div>
                <label htmlFor="tecnico" className="block text-sm font-medium text-gray-700 mb-2">
                  Técnico *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="tecnico" 
                    value={formData.tecnico}
                    onChange={(e) => handleInputChange('tecnico', e.target.value)}
                    readOnly={isEditMode}
                    className={cn(
                      "w-full pl-10 pr-4 py-4 text-base rounded-xl border transition-all duration-200 focus:shadow-md focus:ring-2",
                      isEditMode
                        ? "bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed focus:ring-0 focus:border-gray-200"
                        : errors.tecnico 
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                          : "border-gray-300 focus:ring-green-200 focus:border-green-400"
                    )}
                    placeholder="Nombre del técnico"
                  />
                </div>
                {errors.tecnico && (
                  <p className="text-red-600 text-sm mt-1">{errors.tecnico}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Reparación */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                Reparación
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ¿Se ha conseguido reparar el punto de recarga? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Reparado', 'No reparado'].map((opcion) => (
                    <label
                      key={opcion}
                      className={cn(
                        "flex items-center p-4 sm:p-5 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95 touch-manipulation",
                        formData.resultado === opcion
                          ? "border-[#008606] bg-[#008606]/10"
                          : "border-gray-300 hover:border-gray-400"
                      )}
                    >
                      <input
                        type="radio"
                        name="resultado"
                        value={opcion}
                        checked={formData.resultado === opcion}
                        onChange={() => handleResultadoChange(opcion as 'Reparado' | 'No reparado')}
                        className="w-5 h-5 text-[#008606] border-gray-300 focus:ring-[#008606]"
                      />
                      <span className="ml-3 text-sm sm:text-base font-medium text-gray-700">{opcion}</span>
                    </label>
                  ))}
                </div>
                {errors.resultado && (
                  <p className="text-red-600 text-sm mt-2">{errors.resultado}</p>
                )}
              </div>

              {formData.resultado === 'Reparado' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      ¿Qué has tenido que reparar? *
                    </label>
                    <div className="space-y-3">
                      {serviciosOptions.map((servicio) => (
                        <label
                          key={servicio}
                          className={cn(
                            "flex items-center p-4 sm:p-5 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95 touch-manipulation",
                            formData.reparacion === servicio
                              ? "border-[#008606] bg-[#008606]/10"
                              : "border-gray-300 hover:border-gray-400"
                          )}
                        >
                          <input
                            type="radio"
                            name="reparacion"
                            value={servicio}
                            checked={formData.reparacion === servicio}
                            onChange={() => handleReparacionChange(servicio)}
                            className="w-5 h-5 text-[#008606] border-gray-300 focus:ring-[#008606]"
                          />
                          <span className="ml-3 text-sm sm:text-base font-medium text-gray-700">{servicio}</span>
                        </label>
                      ))}
                    </div>
                    {errors.reparacion && (
                      <p className="text-red-600 text-sm mt-2">{errors.reparacion}</p>
                    )}
                  </div>

                  {formData.reparacion === 'Reparar el cuadro eléctrico' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        ¿Qué has reparado en el cuadro eléctrico? *
                      </label>
                      <div className="space-y-3">
                        {cuadroElectricoOptions.map((opcion) => (
                          <label
                            key={opcion}
                            className={cn(
                              "flex items-center p-4 sm:p-5 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95 touch-manipulation",
                              formData.cuadroElectrico === opcion
                                ? "border-[#008606] bg-[#008606]/10"
                                : "border-gray-300 hover:border-gray-400"
                            )}
                          >
                            <input
                              type="radio"
                              name="cuadroElectrico"
                              value={opcion}
                              checked={formData.cuadroElectrico === opcion}
                              onChange={() => handleCuadroElectricoChange(opcion)}
                              className="w-5 h-5 text-[#008606] border-gray-300 focus:ring-[#008606]"
                            />
                            <span className="ml-3 text-sm sm:text-base text-gray-700">{opcion}</span>
                          </label>
                        ))}
                      </div>
                      {errors.cuadroElectrico && (
                        <p className="text-red-600 text-sm mt-2">{errors.cuadroElectrico}</p>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Campo de detalles que siempre aparece */}
              <div>
                <label htmlFor="detalles" className="block text-sm font-medium text-gray-700 mb-2">
                  Detalles de la reparación *
                </label>
                <textarea
                  id="detalles"
                  value={formData.detalles}
                  onChange={(e) => handleInputChange('detalles', e.target.value)}
                  rows={4}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md resize-none",
                    errors.detalles
                      ? "border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400"
                      : "border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-400"
                  )}
                  placeholder="Describe los detalles de lo que has hecho en esta reparación"
                />
                {errors.detalles && (
                  <p className="text-red-600 text-sm mt-1">{errors.detalles}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Documentación */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                Documentación
              </h2>
              
              <FileUpload
                label="Foto del punto de recarga después de la intervención"
                required
                error={errors.foto}
                onFileSelect={(selected) => handleFileChange('foto', selected)}
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                }}
              />
              {existingAttachments.foto.length > 0 && files.foto.length === 0 && (
                <p className="text-sm text-gray-500 -mt-2">
                  Ya hay {existingAttachments.foto.length === 1 ? 'una foto' : `${existingAttachments.foto.length} fotos`} almacenada para este expediente.
                </p>
              )}

              {/* Mostrar campo de foto de etiqueta solo si se seleccionó "Sustituir el punto de recarga" */}
              {formData.reparacion === 'Sustituir el punto de recarga' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <FileUpload
                    label="Foto de la etiqueta del nuevo equipo"
                    required
                    error={errors.fotoEtiqueta}
                    onFileSelect={(selected) => handleFileChange('fotoEtiqueta', selected)}
                    accept={{
                      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                    }}
                  />
                  {existingAttachments.fotoEtiqueta.length > 0 && files.fotoEtiqueta.length === 0 && (
                    <p className="text-sm text-gray-500 -mt-2">
                      Ya hay {existingAttachments.fotoEtiqueta.length === 1 ? 'una foto' : `${existingAttachments.fotoEtiqueta.length} fotos`} de la etiqueta almacenada.
                    </p>
                  )}
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Factura
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  La factura es opcional. Puedes completar el parte ahora y adjuntar la factura más tarde.
                </p>
                <FileUpload
                  onFileSelect={(selected) => handleFileChange('factura', selected)}
                  accept={{
                    'application/pdf': ['.pdf'],
                    'image/*': ['.png', '.jpg', '.jpeg'],
                  }}
                />
              </div>
              {existingAttachments.factura.length > 0 && files.factura.length === 0 && (
                <p className="text-sm text-gray-500 -mt-2">
                  Ya hay {existingAttachments.factura.length === 1 ? 'una factura' : `${existingAttachments.factura.length} facturas`} vinculada a este expediente.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex flex-row items-center justify-between gap-3 flex-wrap mt-8 pt-6 border-t border-gray-200">
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

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={isSubmitting}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-[#008606] hover:bg-[#008606]/90 active:scale-95 text-white font-semibold px-6 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
            >
              Avanzar
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-[#008606] hover:bg-[#008606]/90 disabled:bg-[#008606]/50 active:scale-95 text-white font-semibold px-6 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  Enviar
                </>
              )}
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
