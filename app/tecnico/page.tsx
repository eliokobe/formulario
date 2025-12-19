'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Calendar, FileText, User, MapPin, Phone, Mail, Clock, CheckCircle, Wrench } from 'lucide-react'

interface Servicio {
  id: string
  fields: {
    'Nombre del Cliente'?: string
    'Cliente'?: string | string[]
    'Teléfono'?: string
    'Email'?: string
    'Tipo de Servicio'?: string
    'Dirección'?: string
    'Estado'?: string
    'Fecha de Servicio'?: string
    'Descripción'?: string
    'Notas Técnico'?: string
    'Enlace Cita'?: string
    'Cita técnico'?: string
    'ID Cliente'?: string
    'Reparaciones'?: string | string[]
  }
}

export default function TecnicoPage() {
  const [telefono, setTelefono] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [tecnicoData, setTecnicoData] = useState<any>(null)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loadingServicios, setLoadingServicios] = useState(false)
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null)
  const [ocultarFinalizados, setOcultarFinalizados] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/tecnico/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telefono: telefono.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al autenticar')
      }

      setTecnicoData(data.tecnico)
      setIsAuthenticated(true)
      
      // Cargar servicios con el teléfono del técnico recién autenticado
      await loadServicios(data.tecnico.id, data.tecnico.fields?.Teléfono)
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  const loadServicios = async (tecnicoId?: string, tecnicoTelefono?: string) => {
    const id = tecnicoId || tecnicoData?.id
    const telefono = tecnicoTelefono || tecnicoData?.fields?.Teléfono
    if (!id || !telefono) return

    setLoadingServicios(true)
    try {
      const response = await fetch(`/api/tecnico/servicios?telefono=${encodeURIComponent(telefono)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar servicios')
      }

      setServicios(data.servicios || [])
    } catch (err: any) {
      console.error('Error al cargar servicios:', err)
    } finally {
      setLoadingServicios(false)
    }
  }

  const getEstadoBadgeColor = (estado?: string) => {
    return 'bg-[#008606]'
  }

  const openServicioDetail = (servicio: Servicio) => {
    const estado = servicio.fields.Estado?.toLowerCase()
    
    // Si el servicio está aceptado, ir al formulario de cita
    if (estado === 'aceptado') {
      window.location.href = `/cita?id=${servicio.id}`
      return
    }
    
    // Si el servicio está citado o finalizado, ir al parte de trabajo usando el ID de Reparaciones
    if (estado === 'citado' || estado === 'finalizado' || estado === 'completado') {
      const reparacionesField = servicio.fields.Reparaciones
      const reparacionId = Array.isArray(reparacionesField) ? reparacionesField[0] : reparacionesField
      
      if (reparacionId) {
        window.location.href = `/parte?id=${reparacionId}`
      } else {
        alert('Este servicio no tiene una reparación asociada')
      }
      return
    }
    
    // En cualquier otro caso, abrir el modal de detalles
    setSelectedServicio(servicio)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Panel Técnico</h2>
            <p className="text-gray-600 mt-2">
              Ingresa tu teléfono para acceder
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-sm font-medium text-gray-700">
                Número de Teléfono
              </Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="612345678"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 border-gray-300 focus:border-[#008606] focus:ring-[#008606]"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white text-center max-w-md mx-auto w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Éxito!
          </h2>
          <p className="text-gray-600 mb-6">
            {successMessage}
          </p>
          <button
            onClick={() => {
              setShowSuccess(false)
              setSuccessMessage('')
              loadServicios()
            }}
            className="w-full bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Volver al Portal
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {tecnicoData?.fields?.Nombre || 'Técnico'}
          </h2>
          <p className="text-gray-600">Servicios Asignados</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center items-center">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={ocultarFinalizados}
                onChange={(e) => setOcultarFinalizados(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#008606] focus:ring-[#008606]"
              />
              Ocultar finalizados
            </label>
          </div>
          
          <div className="space-y-3">
            {loadingServicios ? (
              <div className="text-center py-12">
                <Clock className="w-8 h-8 text-[#008606] animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Cargando servicios...</p>
              </div>
            ) : servicios.filter(s => !ocultarFinalizados || s.fields.Estado !== 'Finalizado').length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tienes servicios asignados</p>
              </div>
            ) : (
              servicios.filter(s => !ocultarFinalizados || s.fields.Estado !== 'Finalizado').map((servicio) => (
                <div 
                  key={servicio.id}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-[#008606] bg-white cursor-pointer transition-all"
                  onClick={() => openServicioDetail(servicio)}
                >
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {(Array.isArray(servicio.fields.Cliente) ? servicio.fields.Cliente[0] : servicio.fields.Cliente) || 'Cliente sin nombre'}
                    </h3>
                    <Badge className={getEstadoBadgeColor(servicio.fields.Estado)}>
                      {servicio.fields.Estado || 'Sin estado'}
                    </Badge>
                  </div>
                  
                  {servicio.fields['Dirección'] && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-[#008606] flex-shrink-0" />
                      <p className="truncate">{servicio.fields['Dirección']}</p>
                    </div>
                  )}
                  
                  {servicio.fields['Tipo de Servicio'] && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Wrench className="w-4 h-4 text-[#008606]" />
                      <p className="truncate">{servicio.fields['Tipo de Servicio']}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedServicio} onOpenChange={() => setSelectedServicio(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          {selectedServicio ? (
            <DialogContentInner 
              servicio={selectedServicio} 
              onSetServicio={setSelectedServicio}
              onLoadServicios={loadServicios}
              onShowSuccess={(message: string) => {
                setSuccessMessage(message)
                setShowSuccess(true)
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DialogContentInner({ 
  servicio, 
  onSetServicio, 
  onLoadServicios,
  onShowSuccess
}: { 
  servicio: Servicio
  onSetServicio: (s: Servicio | null) => void
  onLoadServicios: () => void
  onShowSuccess: (message: string) => void
}) {
  const [actionLoading, setActionLoading] = useState(false)

  const handleAceptarServicio = async (servicioId: string) => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/tecnico/servicios', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          servicioId,
          estado: 'Aceptado',
        }),
      })

      if (!response.ok) {
        throw new Error('Error al aceptar servicio')
      }

      await onLoadServicios()
      onSetServicio(null)
      onShowSuccess('Servicio aceptado correctamente')
    } catch (err: any) {
      alert('Error al aceptar servicio: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRechazarServicio = async (servicioId: string) => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/tecnico/servicios', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          servicioId,
          estado: 'Rechazado',
        }),
      })

      if (!response.ok) {
        throw new Error('Error al rechazar servicio')
      }

      await onLoadServicios()
      onSetServicio(null)
      onShowSuccess('Servicio rechazado correctamente')
    } catch (err: any) {
      alert('Error al rechazar servicio: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleGenerarEnlaceCita = async (servicioId: string, clienteId: string) => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/tecnico/servicios', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          servicioId,
          generarEnlaceCita: true,
          clienteId,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al generar enlace de cita')
      }

      await onLoadServicios()
      alert('Enlace de cita generado correctamente')
    } catch (err: any) {
      alert('Error al generar enlace: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const updateServicioNota = async (servicioId: string, nota: string) => {
    try {
      const response = await fetch('/api/tecnico/servicios', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          servicioId,
          notas: nota,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar nota')
      }

      await onLoadServicios()
      alert('Nota actualizada correctamente')
    } catch (err: any) {
      alert('Error al actualizar nota: ' + err.message)
    }
  }

  const getEstadoBadgeColor = (estado?: string) => {
    return 'bg-[#008606]'
  }

  return (
    <>
      <DialogHeader className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => onSetServicio(null)}
            className="hover:bg-gray-100 p-2 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <DialogTitle className="text-xl">
              {(Array.isArray(servicio.fields.Cliente) ? servicio.fields.Cliente[0] : servicio.fields.Cliente) || 'Cliente sin nombre'}
            </DialogTitle>
            <Badge className={getEstadoBadgeColor(servicio.fields.Estado)}>
              {servicio.fields.Estado || 'Sin estado'}
            </Badge>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4">{servicio.fields.Estado?.toLowerCase() === 'pendiente de aceptación' || 
         servicio.fields.Estado?.toLowerCase() === 'pendiente de aceptacion' ? (
          <>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-base font-semibold text-gray-900 mb-3">
                Información del Cliente
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-[#008606] mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600">Cliente</p>
                    <p className="text-sm font-medium text-gray-900">
                      {(Array.isArray(servicio.fields.Cliente) ? servicio.fields.Cliente[0] : servicio.fields.Cliente) || 'No especificado'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#008606] mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600">Dirección</p>
                    <p className="text-sm font-medium text-gray-900">
                      {servicio.fields['Dirección'] || 'No especificada'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-[#008606] mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600">Teléfono</p>
                    <p className="text-sm font-medium text-gray-900">
                      {servicio.fields['Teléfono'] || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-300 my-4"></div>

            <div className="flex gap-3">
              <button
                onClick={() => handleAceptarServicio(servicio.id)}
                disabled={actionLoading}
                className="flex-1 bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                Aceptar
              </button>
              <button
                onClick={() => handleRechazarServicio(servicio.id)}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-base font-semibold text-gray-900 mb-3">
              Información del Cliente
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#008606] mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Dirección</p>
                  <p className="text-sm font-medium text-gray-900">
                    {servicio.fields['Dirección'] || 'No especificada'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-[#008606] mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Teléfono</p>
                  <p className="text-sm font-medium text-gray-900">
                    {servicio.fields['Teléfono'] || 'No especificado'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-[#008606] mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {servicio.fields['Email'] || 'No especificado'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-[#008606] mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Fecha de Servicio</p>
                  <p className="text-sm font-medium text-gray-900">
                    {servicio.fields['Fecha de Servicio']
                      ? new Date(servicio.fields['Fecha de Servicio'] as string).toLocaleDateString('es-ES')
                      : 'No especificada'}
                  </p>
                </div>
              </div>
              
              {servicio.fields['Descripción'] && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Descripción</p>
                  <p className="text-sm font-medium text-gray-900">{servicio.fields['Descripción']}</p>
                </div>
              )}
            </div>
          </div>
        )}


        {servicio.fields.Estado?.toLowerCase() === 'aceptado' ? (
          <div className="border-2 border-green-500 rounded-lg p-4">
            <h4 className="text-base font-semibold text-gray-900 mb-2">Siguiente Paso: Generar Cita</h4>
            <p className="text-sm text-gray-600 mb-4">
              El servicio ha sido aceptado. Genera el enlace de cita para el cliente.
            </p>
            {servicio.fields['Enlace Cita'] ? (
              <div className="space-y-3">
                <Alert className="border-green-200 bg-green-50">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm text-green-800">
                    Enlace de cita generado
                  </AlertDescription>
                </Alert>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 break-all text-sm">
                  <a 
                    href={servicio.fields['Enlace Cita']} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {servicio.fields['Enlace Cita']}
                  </a>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(servicio.fields['Enlace Cita'] || '')
                    alert('Enlace copiado al portapapeles')
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  Copiar Enlace
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleGenerarEnlaceCita(
                  servicio.id,
                  servicio.fields['ID Cliente'] || ''
                )}
                disabled={actionLoading}
                className="w-full bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                Generar Enlace de Cita
              </button>
            )}
          </div>
        ) : servicio.fields.Estado?.toLowerCase() === 'citado' && servicio.fields['Cita técnico'] ? (
          <div className="border-2 border-green-600 rounded-lg p-4">
            <h4 className="text-base font-semibold text-gray-900 mb-2">Parte de Trabajo</h4>
            <p className="text-sm text-gray-600 mb-4">
              La cita ha sido confirmada. Accede al parte de trabajo.
            </p>
            <Alert className="border-green-200 bg-green-50 mb-3">
              <FileText className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800">
                Cita programada: {servicio.fields['Cita técnico']}
              </AlertDescription>
            </Alert>
            <button
              onClick={() => {
                const reparacionesField = servicio.fields.Reparaciones
                const reparacionId = Array.isArray(reparacionesField) ? reparacionesField[0] : reparacionesField
                
                if (reparacionId) {
                  window.open(`/parte?id=${reparacionId}`, '_blank')
                } else {
                  alert('Este servicio no tiene una reparación asociada')
                }
              }}
              className="w-full bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Abrir Parte de Trabajo
            </button>
          </div>
        ) : null}
      </div>
    </>
  )
}
