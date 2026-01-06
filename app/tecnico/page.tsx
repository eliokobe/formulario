'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Calendar, FileText, User, MapPin, Phone, Mail, Clock, CheckCircle, Wrench, LogOut, Filter } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface Servicio {
  id: string
  fields: {
    'Nombre del Cliente'?: string
    'Cliente'?: string | string[]
    'Teléfono'?: string
    'Email'?: string
    'Tipo de Servicio'?: string
    'Dirección'?: string
    'Población'?: string
    'Población del cliente'?: string | string[]
    'Estado'?: string
    'Motivo'?: string
    'Fecha estado'?: string
    'Cita'?: string
    'Fecha de Servicio'?: string
    'Descripción'?: string
    'Notas Técnico'?: string
    'Enlace Cita'?: string
    'Cita técnico'?: string
    'ID Cliente'?: string
    'Reparaciones'?: string | string[]
    'Factura'?: string | string[]
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
  const [acceptedServicioId, setAcceptedServicioId] = useState<string | null>(null)
  const [successType, setSuccessType] = useState<'accepted' | 'rejected'>('accepted')

  // Cargar sesión guardada al montar el componente
  useEffect(() => {
    const savedTecnico = localStorage.getItem('tecnicoData')
    if (savedTecnico) {
      try {
        const data = JSON.parse(savedTecnico)
        setTecnicoData(data)
        setIsAuthenticated(true)
        loadServicios(data.id, data.fields?.Teléfono)
      } catch (err) {
        console.error('Error al cargar sesión guardada:', err)
        localStorage.removeItem('tecnicoData')
      }
    }
  }, [])

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

      // Guardar datos del técnico en localStorage
      localStorage.setItem('tecnicoData', JSON.stringify(data.tecnico))
      
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

  const handleLogout = () => {
    localStorage.removeItem('tecnicoData')
    setIsAuthenticated(false)
    setTecnicoData(null)
    setServicios([])
    setTelefono('')
  }

  const getEstadoBadgeColor = (servicio: Servicio) => {
    const estado = servicio.fields.Estado?.toLowerCase()
    const fechaEstado = servicio.fields['Fecha estado']
    const fechaCita = servicio.fields['Cita']
    
    // Excepciones: No aplicar naranja en estos casos
    if (estado === 'no reparado' || estado === 'finalizado') {
      return 'bg-[#008606]'
    }
    
    // Si está citado y la fecha de cita no ha llegado, no aplicar naranja
    if (estado === 'citado' && fechaCita) {
      const citaDate = new Date(fechaCita)
      const now = new Date()
      if (citaDate > now) {
        return 'bg-[#008606]'
      }
    }
    
    // Verificar si han pasado 24 horas desde fecha estado
    if (fechaEstado) {
      const fechaEstadoDate = new Date(fechaEstado)
      const now = new Date()
      const diffHours = (now.getTime() - fechaEstadoDate.getTime()) / (1000 * 60 * 60)
      
      if (diffHours >= 24) {
        return 'bg-orange-500'
      }
    }
    
    return 'bg-[#008606]'
  }

  const openServicioDetail = (servicio: Servicio) => {
    const estado = servicio.fields.Estado?.toLowerCase()
    
    // Si el servicio está aceptado, ir al formulario de cita
    if (estado === 'aceptado') {
      window.location.href = `/cita?id=${servicio.id}`
      return
    }
    
    // Si el servicio está citado, reparado o no reparado, ir al parte de trabajo
    if (estado === 'citado' || estado === 'reparado' || estado === 'no reparado') {
      // Como estamos trabajando directamente con reparaciones, el id es el id de la reparación
      window.location.href = `/parte?id=${servicio.id}`
      return
    }
    
    // En cualquier otro caso (Asignado), abrir el modal de detalles
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
            {successType === 'accepted' ? 'Servicio Aceptado' : '¡Éxito!'}
          </h2>
          <p className="text-gray-600 mb-6">
            {successMessage}
          </p>
          {successType === 'accepted' && acceptedServicioId ? (
            <>
              <p className="text-gray-700 font-medium mb-6">
                ¿Quieres continuar para agendar la cita?
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    window.location.href = `/cita?id=${acceptedServicioId}`
                  }}
                  className="w-full bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Sí, agendar cita
                </button>
                <button
                  onClick={() => {
                    setShowSuccess(false)
                    setSuccessMessage('')
                    setAcceptedServicioId(null)
                    loadServicios()
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  No, volver al portal
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => {
                setShowSuccess(false)
                setSuccessMessage('')
                setAcceptedServicioId(null)
                loadServicios()
              }}
              className="w-full bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Volver al Portal
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white lg:bg-gray-50 flex items-center justify-center p-4 lg:p-8">
      <div className="max-w-md lg:max-w-6xl w-full space-y-6">
        <div className="text-center lg:mb-8">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1"></div>
            <div className="flex-1">
              <h2 className="text-2xl lg:text-4xl font-bold text-gray-900">
                {tecnicoData?.fields?.Nombre || 'Técnico'}
              </h2>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 transition-colors p-2 lg:p-3"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
          </div>
          <p className="text-gray-600 lg:text-lg">Servicios Asignados</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center items-center">
            <div className="bg-gray-50 lg:bg-white rounded-xl p-3 lg:p-4 border border-gray-200 lg:shadow-sm inline-flex items-center gap-3">
              <Filter className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" />
              <label className="flex items-center gap-3 text-sm lg:text-base font-medium text-gray-700 cursor-pointer">
                <span>Ocultar finalizados</span>
                <Switch
                  checked={ocultarFinalizados}
                  onCheckedChange={setOcultarFinalizados}
                />
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
            {loadingServicios ? (
              <div className="text-center py-12">
                <Clock className="w-8 h-8 text-[#008606] animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Cargando servicios...</p>
              </div>
            ) : servicios.filter(s => {
              const estado = s.fields.Estado?.toLowerCase()
              
              if (ocultarFinalizados) {
                // Mostrar solo: Asignado, Aceptado, Citado (ocultar Reparado y No reparado)
                return estado === 'asignado' || 
                       estado === 'aceptado' || 
                       estado === 'citado'
              }
              // Mostrar todos
              return true
            }).length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tienes servicios asignados</p>
              </div>
            ) : (
              servicios.filter(s => {
                const estado = s.fields.Estado?.toLowerCase()
                
                if (ocultarFinalizados) {
                  // Mostrar solo: Asignado, Aceptado, Citado (ocultar Reparado y No reparado)
                  return estado === 'asignado' || 
                         estado === 'aceptado' || 
                         estado === 'citado'
                }
                // Mostrar todos
                return true
              }).map((servicio) => (
                <div 
                  key={servicio.id}
                  className="p-4 lg:p-5 rounded-xl border-2 border-gray-200 hover:border-[#008606] bg-white cursor-pointer transition-all hover:shadow-lg lg:hover:scale-[1.02] duration-200"
                  onClick={() => openServicioDetail(servicio)}
                >
                  {/* Nombre y estado en la misma línea */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1 text-base lg:text-lg">
                      {(Array.isArray(servicio.fields.Cliente) ? servicio.fields.Cliente[0] : servicio.fields.Cliente) || 'Cliente sin nombre'}
                    </h3>
                    <Badge className={getEstadoBadgeColor(servicio)}>
                      {servicio.fields.Estado || 'Sin estado'}
                    </Badge>
                  </div>
                  
                  {/* Motivo */}
                  {servicio.fields['Motivo'] && (
                    <div className="text-sm lg:text-base text-gray-600 mb-3 pl-0">
                      <span className="font-medium">Motivo: </span>
                      <span>{servicio.fields['Motivo']}</span>
                    </div>
                  )}
                  
                  {/* Dirección */}
                  {servicio.fields['Dirección'] && (
                    <div className="flex items-start gap-2 text-sm lg:text-base text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 text-[#008606] flex-shrink-0" />
                      <p className="truncate">{servicio.fields['Dirección']}</p>
                    </div>
                  )}
                  
                  {/* Población */}
                  {(servicio.fields['Población'] || servicio.fields['Población del cliente']) && (
                    <div className="text-sm lg:text-base text-gray-600 mb-2 ml-6 lg:ml-7">
                      <p className="truncate">
                        {Array.isArray(servicio.fields['Población del cliente']) 
                          ? servicio.fields['Población del cliente'][0] 
                          : servicio.fields['Población del cliente'] || servicio.fields['Población']}
                      </p>
                    </div>
                  )}
                  
                  {servicio.fields['Tipo de Servicio'] && (
                    <div className="flex items-center gap-2 text-sm lg:text-base text-gray-600">
                      <Wrench className="w-4 h-4 lg:w-5 lg:h-5 text-[#008606]" />
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
              onShowSuccess={(message: string, type: 'accepted' | 'rejected', servicioId?: string) => {
                setSuccessMessage(message)
                setSuccessType(type)
                if (servicioId) setAcceptedServicioId(servicioId)
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
  onShowSuccess: (message: string, type: 'accepted' | 'rejected', servicioId?: string) => void
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
      onShowSuccess('Servicio aceptado correctamente', 'accepted', servicioId)
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
      onShowSuccess('Servicio rechazado correctamente', 'rejected')
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

  const getEstadoBadgeColor = (servicio: Servicio) => {
    const estado = servicio.fields.Estado?.toLowerCase()
    const fechaEstado = servicio.fields['Fecha estado']
    const fechaCita = servicio.fields['Cita']
    
    // Excepciones: No aplicar naranja en estos casos
    if (estado === 'no reparado' || estado === 'finalizado') {
      return 'bg-[#008606]'
    }
    
    // Si está citado y la fecha de cita no ha llegado, no aplicar naranja
    if (estado === 'citado' && fechaCita) {
      const citaDate = new Date(fechaCita)
      const now = new Date()
      if (citaDate > now) {
        return 'bg-[#008606]'
      }
    }
    
    // Verificar si han pasado 24 horas desde fecha estado
    if (fechaEstado) {
      const fechaEstadoDate = new Date(fechaEstado)
      const now = new Date()
      const diffHours = (now.getTime() - fechaEstadoDate.getTime()) / (1000 * 60 * 60)
      
      if (diffHours >= 24) {
        return 'bg-orange-500'
      }
    }
    
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
            <Badge className={getEstadoBadgeColor(servicio)}>
              {servicio.fields.Estado || 'Sin estado'}
            </Badge>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4">{servicio.fields.Estado?.toLowerCase() === 'asignado' ? (
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
                // Como estamos trabajando directamente con reparaciones, el id es el id de la reparación
                window.open(`/parte?id=${servicio.id}`, '_blank')
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
