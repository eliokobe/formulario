"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Camera, Upload, FileText, CheckCircle2, AlertTriangle, Wrench, User, MapPin } from 'lucide-react';

interface WorkReportProps {
  repairData?: {
    cliente: string;
    direccion: string;
    tecnico: string;
  };
  onReportComplete: () => void;
  onReportError: (error: string) => void;
}

export function WorkReport({ 
  repairData = {
    cliente: 'Cliente de ejemplo',
    direccion: 'Dirección de ejemplo',
    tecnico: 'Técnico de ejemplo'
  },
  onReportComplete,
  onReportError 
}: WorkReportProps) {
  const [formData, setFormData] = useState({
    problemaSolucionado: '', // 'Reparado' o 'Sin reparar'
    accionRealizada: '', // Múltiples opciones
    problemaDescripcion: '',
  });
  
  const [files, setFiles] = useState({
    fotoReparacion: null as File | null,
    facturaServicio: null as File | null,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accionesDisponibles = [
    'Repara el cuadro eléctrico',
    'Resetear la placa electrónica',
    'Sustituir el punto de recarga',
    'Revisar la instalación'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.problemaSolucionado) {
      newErrors.problemaSolucionado = 'Indica si se solucionó el problema';
    }

    if (!formData.accionRealizada) {
      newErrors.accionRealizada = 'Selecciona la acción realizada';
    }

    if (!formData.problemaDescripcion.trim()) {
      newErrors.problemaDescripcion = 'Describe el problema encontrado';
    }

    if (!files.fotoReparacion) {
      newErrors.fotoReparacion = 'Sube una foto del punto de recarga después de la intervención';
    }

    if (!files.facturaServicio) {
      newErrors.facturaServicio = 'Adjunta la factura del servicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Aquí enviarías los datos del parte de trabajo
      const workReportData = {
        problemaSolucionado: formData.problemaSolucionado,
        accionRealizada: formData.accionRealizada,
        problemaDescripcion: formData.problemaDescripcion,
        // En un caso real, aquí subirías los archivos
        fotoReparacion: files.fotoReparacion?.name,
        facturaServicio: files.facturaServicio?.name,
        fechaCompletado: new Date().toISOString(),
      };

      const response = await fetch('/api/work-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workReportData),
      });

      if (!response.ok) {
        try {
          const data = await response.json();
          onReportError(typeof data?.error === 'string' ? data.error : 'Error al enviar el parte de trabajo');
        } catch {
          onReportError('Error al enviar el parte de trabajo');
        }
        return;
      }
      
      onReportComplete();
      
      // Reset form
      setFormData({
        problemaSolucionado: '',
        accionRealizada: '',
        problemaDescripcion: '',
      });
      setFiles({ fotoReparacion: null, facturaServicio: null });
    } catch (error: any) {
      const msg = typeof error?.message === 'string' ? error.message : 'Error al enviar el parte de trabajo.';
      onReportError(msg);
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

  const handleFileChange = (type: 'fotoReparacion' | 'facturaServicio', file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }));
    
    if (errors[type]) {
      setErrors(prev => ({ ...prev, [type]: '' }));
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20 max-w-4xl mx-auto">
      <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <FileText className="w-6 h-6 text-[#008606]" />
        Parte de Trabajo
      </h3>

      {/* Datos de la Reparación */}
      <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-green-50 rounded-xl border border-green-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Datos de la Reparación</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-[#008606]" />
            <div>
              <p className="text-sm text-gray-600">Cliente:</p>
              <p className="font-medium text-gray-900">{repairData.cliente}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-[#008606]" />
            <div>
              <p className="text-sm text-gray-600">Dirección:</p>
              <p className="font-medium text-gray-900">{repairData.direccion}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5 text-[#008606]" />
            <div>
              <p className="text-sm text-gray-600">Técnico:</p>
              <p className="font-medium text-gray-900">{repairData.tecnico}</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <h4 className="text-lg font-semibold text-gray-900">Sección de Preguntas</h4>

        {/* ¿Has conseguido solucionar el problema? */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            ¿Has conseguido solucionar el problema? *
          </label>
          <div className="flex gap-4">
            {['Reparado', 'Sin reparar'].map((opcion) => (
              <label
                key={opcion}
                className={cn(
                  "flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md",
                  formData.problemaSolucionado === opcion
                    ? "border-[#008606] bg-[#008606]/10"
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                <input
                  type="radio"
                  name="problemaSolucionado"
                  value={opcion}
                  checked={formData.problemaSolucionado === opcion}
                  onChange={(e) => handleInputChange('problemaSolucionado', e.target.value)}
                  className="w-4 h-4 text-[#008606] border-gray-300 focus:ring-[#008606]"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {opcion === 'Reparado' ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      {opcion}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      {opcion}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
          {errors.problemaSolucionado && (
            <p className="text-red-600 text-sm mt-2">{errors.problemaSolucionado}</p>
          )}
        </div>

        {/* ¿Qué has tenido que hacer? */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            ¿Qué has tenido que hacer? *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accionesDisponibles.map((accion) => (
              <label
                key={accion}
                className={cn(
                  "flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md",
                  formData.accionRealizada === accion
                    ? "border-[#008606] bg-[#008606]/10"
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                <input
                  type="radio"
                  name="accionRealizada"
                  value={accion}
                  checked={formData.accionRealizada === accion}
                  onChange={(e) => handleInputChange('accionRealizada', e.target.value)}
                  className="w-4 h-4 text-[#008606] border-gray-300 focus:ring-[#008606]"
                />
                <span className="ml-2 text-sm text-gray-700">{accion}</span>
              </label>
            ))}
          </div>
          {errors.accionRealizada && (
            <p className="text-red-600 text-sm mt-2">{errors.accionRealizada}</p>
          )}
        </div>

        {/* Foto del punto de recarga */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sube una foto del punto de recarga después de la intervención *
          </label>
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-[#008606] text-white rounded-lg cursor-pointer hover:bg-[#1F4D11] transition-colors">
                <Camera className="w-4 h-4" />
                Tomar Foto
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileChange('fotoReparacion', e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                <Upload className="w-4 h-4" />
                Subir Archivo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('fotoReparacion', e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
            
            {files.fotoReparacion && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {files.fotoReparacion.name}
              </div>
            )}
            
            {errors.fotoReparacion && (
              <p className="text-red-600 text-sm">{errors.fotoReparacion}</p>
            )}
          </div>
        </div>

        {/* Factura del servicio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adjunta la factura del servicio *
          </label>
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-[#008606] text-white rounded-lg cursor-pointer hover:bg-[#1F4D11] transition-colors">
                <Camera className="w-4 h-4" />
                Fotografiar Factura
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileChange('facturaServicio', e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                <Upload className="w-4 h-4" />
                Subir Archivo
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange('facturaServicio', e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
            
            {files.facturaServicio && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {files.facturaServicio.name}
              </div>
            )}
            
            {errors.facturaServicio && (
              <p className="text-red-600 text-sm">{errors.facturaServicio}</p>
            )}
          </div>
        </div>

        {/* ¿Qué problema has tenido? */}
        <div>
          <label htmlFor="problemaDescripcion" className="block text-sm font-medium text-gray-700 mb-2">
            ¿Qué problema has tenido? *
          </label>
          <textarea
            id="problemaDescripcion"
            value={formData.problemaDescripcion}
            onChange={(e) => handleInputChange('problemaDescripcion', e.target.value)}
            rows={4}
            className={cn(
              "w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:shadow-md resize-none",
              errors.problemaDescripcion 
                ? "border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400" 
                : "border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-green-400"
            )}
            placeholder="Describe detalladamente el problema que has encontrado y cómo lo has resuelto..."
          />
          {errors.problemaDescripcion && (
            <p className="text-red-600 text-sm mt-1">{errors.problemaDescripcion}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#1F4D11] hover:bg-[#1F4D11]/90 disabled:bg-[#1F4D11]/50 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando Parte de Trabajo...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Completar Parte de Trabajo
            </>
          )}
        </button>
      </form>
    </div>
  );
}
