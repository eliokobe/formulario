'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Calendar, FileText, User, MapPin, Phone, Mail, Clock, CheckCircle, Wrench, LogOut, Filter, Navigation, ClipboardList, GraduationCap, MessageCircle, Home, HeadphonesIcon } from 'lucide-react'
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
    'Código postal'?: string | string[]
    'Provincia'?: string | string[]
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
  const [searchTerm, setSearchTerm] = useState('')
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
    const id = tecnicoId || tecnicoData?.idAl 
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
    // Siempre abrir el modal de detalles para todos los estados
    // El modal mostrará las pestañas y las acciones correspondientes según el estado
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
                    // Buscar el servicio aceptado para obtener el ID de la reparación
                    const servicio = servicios.find(s => s.id === acceptedServicioId)
                    const reparacionId = servicio?.fields?.Reparaciones 
                      ? (Array.isArray(servicio.fields.Reparaciones) 
                          ? servicio.fields.Reparaciones[0] 
                          : servicio.fields.Reparaciones)
                      : acceptedServicioId
                    window.location.href = `/cita?id=${reparacionId}`
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
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Servicios</h1>
        
        {/* Barra de búsqueda estilo WhatsApp */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar servicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-4 pr-4 bg-gray-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008606] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Botón filtro */}
        <div className="mb-6">
          <button
            onClick={() => setOcultarFinalizados(!ocultarFinalizados)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              ocultarFinalizados 
                ? 'bg-gray-800 text-white' 
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            Ocultar finalizados
          </button>
        </div>
        
        {/* Grid de servicios */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {loadingServicios ? (
              <div className="col-span-full text-center py-16">
                <Clock className="w-8 h-8 text-[#008606] animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Cargando servicios...</p>
              </div>
            ) : servicios.filter(s => {
              const estado = s.fields.Estado?.toLowerCase()
              const cliente = Array.isArray(s.fields.Cliente) ? s.fields.Cliente[0] : s.fields.Cliente || ''
              const motivo = s.fields.Motivo || ''
              
              // Filtro de búsqueda
              const matchesSearch = searchTerm === '' || 
                cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (typeof motivo === 'string' && motivo.toLowerCase().includes(searchTerm.toLowerCase()))
              
              if (!matchesSearch) return false
              
              if (ocultarFinalizados) {
                // Mostrar solo: Asignado, Aceptado, Citado (ocultar Reparado y No reparado)
                return estado === 'asignado' || 
                       estado === 'aceptado' || 
                       estado === 'citado'
              }
              // Mostrar todos
              return true
            }).length === 0 ? (
              <div className="col-span-full text-center py-16">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No tienes servicios asignados</p>
              </div>
            ) : (
              servicios.filter(s => {
                const estado = s.fields.Estado?.toLowerCase()
                const cliente = Array.isArray(s.fields.Cliente) ? s.fields.Cliente[0] : s.fields.Cliente || ''
                const motivo = s.fields.Motivo || ''
                
                // Filtro de búsqueda
                const matchesSearch = searchTerm === '' || 
                  cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (typeof motivo === 'string' && motivo.toLowerCase().includes(searchTerm.toLowerCase()))
                
                if (!matchesSearch) return false
                
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
                  className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-[#008606] hover:shadow-sm transition-all duration-200"
                  onClick={() => openServicioDetail(servicio)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm flex-1 line-clamp-2">
                      {(Array.isArray(servicio.fields.Cliente) ? servicio.fields.Cliente[0] : servicio.fields.Cliente) || 'Cliente sin nombre'}
                    </h3>
                    <Badge className={`${getEstadoBadgeColor(servicio)} text-[10px] px-2 py-0.5`}>
                      {servicio.fields.Estado || 'Sin estado'}
                    </Badge>
                  </div>
                  
                  {servicio.fields['Motivo'] && (
                    <div className="text-xs text-gray-600 line-clamp-2">
                      <span className="font-medium">Motivo: </span>
                      <span>{servicio.fields['Motivo']}</span>
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

      {/* Barra de navegación inferior estilo app móvil */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50">
        <div className="grid grid-cols-4 h-16">
          <button className="flex flex-col items-center justify-center gap-1 text-[#008606] bg-gray-50">
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Inicio</span>
          </button>
          
          <button
            onClick={() => window.open('https://formacion.ritest.es/reparadores', '_blank', 'noopener,noreferrer')}
            className="flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-xs font-medium">Formación</span>
          </button>
          
          <a
            href="https://wa.me/34611563835"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-medium">WhatsApp</span>
          </a>
          
          <a
            href="tel:+34611563835"
            className="flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Phone className="w-5 h-5" />
            <span className="text-xs font-medium">Teléfono</span>
          </a>
        </div>
      </div>

      {/* Versión desktop - barra superior */}
      <div className="hidden lg:flex fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-6 py-3 z-50">
        <div className="max-w-5xl mx-auto w-full flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#008606] bg-gray-50 rounded-full">
            <Home className="w-4 h-4" />
            <span>Inicio</span>
          </button>
          
          <button
            onClick={() => window.open('https://formacion.ritest.es/reparadores', '_blank', 'noopener,noreferrer')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Formación</span>
          </button>
          
          <a
            href="https://wa.me/34611563835"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>
          
          <div className="ml-auto">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getPasosResolucion(motivo: string | string[] | undefined, modeloCargador?: string): { pasos: string[], requiereModelo: boolean } {
  // Convertir a string si es un array o manejar undefined/null
  const motivoStr = Array.isArray(motivo) ? motivo[0] : (motivo || '')
  const motivoLower = typeof motivoStr === 'string' ? motivoStr.toLowerCase() : ''
  
  // Sustituir cargador
  if (motivoLower.includes('sustituir cargador')) {
    return {
      pasos: [
        'Retirar el equipo antiguo',
        'Instalar el nuevo',
        'Vincular el cargador a la app',
        'Configurar la app del cargador (potencia, horarios, GDP y Carga solar si aplica…)',
        'Completar el parte de trabajo'
      ],
      requiereModelo: false
    }
  }
  
  // Sustituir protecciones
  if (motivoLower.includes('sustituir protecciones')) {
    return {
      pasos: [
        'Retirar el componente antiguo',
        'Instalar el nuevo',
        'Hacer comprobaciones de correcto funcionamiento',
        'Completar el parte de trabajo'
      ],
      requiereModelo: false
    }
  }
  
  // Sustituir GDP
  if (motivoLower.includes('sustituir gdp')) {
    return {
      pasos: [
        'Retirar el GDO antiguo',
        'Instalar el nuevo',
        'Hacer comprobaciones de correcto funcionamiento',
        'Completar el parte de trabajo'
      ],
      requiereModelo: false
    }
  }
  
  // Sustituir borna doble
  if (motivoLower.includes('sustituir borna doble')) {
    return {
      pasos: [
        'Comprar la borna doble',
        'Retirar la borna antigua',
        'Instalar la nueva',
        'Hacer comprobaciones de correcto funcionamiento',
        'Completar el parte de trabajo'
      ],
      requiereModelo: false
    }
  }
  
  // Diferencial monofásico averiado
  if (motivoLower.includes('diferencial monofásico averiado')) {
    return {
      pasos: [
        'Comprobar tensión de entrada y salida con el multímetro',
        'Pulsar botón de test para confirmar el fallo mecánico',
        'Retirar el componente averiado e instalar el nuevo',
        'Verificar el correcto apriete de los bornes',
        'Completar el parte de trabajo'
      ],
      requiereModelo: false
    }
  }
  
  // Diferencial trifásico averiado
  if (motivoLower.includes('diferencial trifásico averiado')) {
    return {
      pasos: [
        'Comprobar tensión de entrada y salida con el multímetro',
        'Pulsar botón de test para confirmar el fallo mecánico',
        'Retirar el componente averiado e instalar el nuevo',
        'Verificar el correcto apriete de los bornes',
        'Completar el parte de trabajo'
      ],
      requiereModelo: false
    }
  }
  
  // Sobretensiones monofásico averiado
  if (motivoLower.includes('sobretensiones monofásico averiado')) {
    return {
      pasos: [
        'Comprobar si el indicador visual de la protección está en rojo (fallo)',
        'Medir tensión de entrada para descartar anomalías en la red',
        'Retirar el componente averiado e instalar el nuevo',
        'Verificar la correcta conexión de la toma de tierra',
        'Completar el parte de trabajo'
      ],
      requiereModelo: false
    }
  }
  
  // Sobretensiones trifásico averiado
  if (motivoLower.includes('sobretensiones trifásico averiado')) {
    return {
      pasos: [
        'Comprobar si el indicador visual de la protección está en rojo (fallo)',
        'Medir tensión de entrada para descartar anomalías en la red',
        'Retirar el componente averiado e instalar el nuevo',
        'Verificar la correcta conexión de la toma de tierra',
        'Completar el parte de trabajo'
      ],
      requiereModelo: false
    }
  }
  
  // Cargador apagado
  if (motivoLower.includes('cargador apagado')) {
    return {
      pasos: [
        'Comprobar tensión en los bornes de entrada del cargador',
        'Revisar el estado de las conexiones internas y fusibles de la placa',
        'Realizar un rearme eléctrico completo desde el cuadro general',
        'Si tras el rearme no enciende, proceder a la sustitución del equipo',
        'Completar el parte de trabajo'
      ],
      requiereModelo: false
    }
  }
  
  // Carga a menor potencia
  if (motivoLower.includes('carga a menor potencia')) {
    return {
      pasos: [
        'Revisar la configuración de potencia del cargador tanto en la página principal cómo en la sección "Gestión de la carga"',
        'Revisar que no tenga activada ninguna opción de "Carga solar"',
        'Revisar si existe alguna limitación en el coche',
        'Restaurar el equipo por la placa electrónica',
        'Completar el parte de trabajo'
      ],
      requiereModelo: false
    }
  }
  
  // Carga en espera
  if (motivoLower.includes('carga en espera')) {
    return {
      pasos: [
        'Comprobar que el coche no esté lleno',
        'Revisar la programación del cargador',
        'Revisar la programación del coche',
        'Restaurar el equipo por la placa electrónica',
        'Completar el parte de trabajo'
      ],
      requiereModelo: false
    }
  }
  
  // Salta la luz del contador - requiere modelo
  if (motivoLower.includes('salta la luz del contador')) {
    if (modeloCargador?.toLowerCase().includes('max')) {
      return {
        pasos: [
          'Comprobar que el GDP esté correctamente configurado en la app',
          'Comprobar que la pinza amperimétrica esté correctamente instalada y que sólo mida el consumo de la vivienda',
          'Comprobar que tiene la resistencia el GDP',
          'Pon el interruptor PWR BOOS de la placa electrónica en la posición T',
          'Completar el parte de trabajo'
        ],
        requiereModelo: false
      }
    } else if (modeloCargador?.toLowerCase().includes('plus')) {
      return {
        pasos: [
          'Comprobar que el GDP esté correctamente configurado en la app',
          'Comprobar que la pinza amperimétrica esté correctamente instalada y que sólo mida el consumo de la vivienda',
          'Comprobar que tiene la resistencia el GDP',
          'Pon el interruptor RS485 de la placa electrónica en la posición T',
          'Completar el parte de trabajo'
        ],
        requiereModelo: false
      }
    }
    return {
      pasos: ['Especificar si es Pulsar Max o Pulsar Plus'],
      requiereModelo: true
    }
  }
  
  // Instalación GDP - requiere modelo
  if (motivoLower.includes('instalación gdp')) {
    if (modeloCargador?.toLowerCase().includes('max')) {
      return {
        pasos: [
          'Instalar el cableado del GDP',
          'Instalar el GDP poniendo las pinzas en correcto orden',
          'Pon el interruptor PWR BOOS de la placa electrónica en la posición T',
          'Poner la resistencia del GDP',
          'Completar el parte de trabajo'
        ],
        requiereModelo: false
      }
    } else if (modeloCargador?.toLowerCase().includes('plus')) {
      return {
        pasos: [
          'Instalar el cableado del GDP',
          'Instalar el GDP poniendo las pinzas en correcto orden',
          'Pon el interruptor RS485 de la placa electrónica en la posición T',
          'Poner la resistencia del GDP',
          'Completar el parte de trabajo'
        ],
        requiereModelo: false
      }
    }
    return {
      pasos: ['Especificar si es Pulsar Max o Pulsar Plus'],
      requiereModelo: true
    }
  }
  
  // No se conecta por bluetooth
  if (motivoLower.includes('no se conecta por bluetooth')) {
    return {
      pasos: [
        'Hacer una restauración de placa electrónica',
        'Mientras se restaura hay que borrar el dispositivo que empieza por WB- en el Bluetooth del móvil',
        'Una vez restaurado se debe vincular el cargador a la app Wallbox',
        'Si esto no funciona se debe probar a hacer el mismo procedimiento pero con otro móvil'
      ],
      requiereModelo: false
    }
  }
  
  // No reconoce el GDP
  if (motivoLower.includes('no reconoce el gdp')) {
    return {
      pasos: [
        'Comprobar posición cables según diagrama',
        'Medir 12v en las conexiones inferiores del N1CT',
        'Si hay 12v, el N1CT debe mostrar un led rojo',
        'Una vez resuelta cualquier irregularidad, el cargador wallbox se reinicia desde el cuadro eléctrico para que detecte los cambios'
      ],
      requiereModelo: false
    }
  }
  
  // Otros
  return {
    pasos: [
      'Revisar Motivo técnico y si tienes dudas consultar con el número de soporte para técnicos que es el 633 177 456'
    ],
    requiereModelo: false
  }
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
  const [modeloCargador, setModeloCargador] = useState<string>('')

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

      <Tabs defaultValue={"accion"} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value={"accion"}>Acción</TabsTrigger>
          <TabsTrigger value={"pasos"}>
            <ClipboardList className="w-4 h-4 mr-1" />
            Pasos
          </TabsTrigger>
          <TabsTrigger value={"ubicacion"}>
            <Navigation className="w-4 h-4 mr-1" />
            Ubicación
          </TabsTrigger>
        </TabsList>

        <TabsContent value={"accion"} className="space-y-4 mt-4">
          {servicio.fields.Estado?.toLowerCase() === 'asignado' ? (
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
                <Phone className="w-4 h-4 text-[#008606] mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Teléfono</p>
                  <p className="text-sm font-medium text-gray-900">
                    {servicio.fields['Teléfono'] || 'No especificado'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-[#008606] mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Cita</p>
                  <p className="text-sm font-medium text-gray-900">
                    {servicio.fields['Cita técnico'] || servicio.fields['Cita']
                      ? new Date((servicio.fields['Cita técnico'] || servicio.fields['Cita']) as string).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'No especificada'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#008606] mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Último cambio</p>
                  <p className="text-sm font-medium text-gray-900">
                    {servicio.fields['Fecha estado']
                      ? new Date(servicio.fields['Fecha estado'] as string).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
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


        {servicio.fields.Estado?.toLowerCase() === 'aceptado' && (
          <button
            onClick={() => {
              // Obtener el ID de la reparación del campo Reparaciones
              const reparacionId = servicio.fields.Reparaciones 
                ? (Array.isArray(servicio.fields.Reparaciones) 
                    ? servicio.fields.Reparaciones[0] 
                    : servicio.fields.Reparaciones)
                : servicio.id
              window.location.href = `/cita?id=${reparacionId}`
            }}
            className="w-full bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Programar Cita
          </button>
        )}
        
        {servicio.fields.Estado?.toLowerCase() === 'citado' && (
          <>
            {servicio.fields['Cita técnico'] && (
              <Alert className="border-green-200 bg-green-50 mb-3">
                <FileText className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm text-green-800">
                  Cita programada: {servicio.fields['Cita técnico']}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-3">
              <button
                onClick={() => {
                  // Obtener el ID de la reparación del campo Reparaciones
                  const reparacionId = servicio.fields.Reparaciones 
                    ? (Array.isArray(servicio.fields.Reparaciones) 
                        ? servicio.fields.Reparaciones[0] 
                        : servicio.fields.Reparaciones)
                    : servicio.id
                  window.open(`/parte?id=${reparacionId}`, '_blank')
                }}
                className="w-full bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Abrir Parte de Trabajo
              </button>
              <button
                onClick={() => {
                  // Obtener el ID de la reparación del campo Reparaciones
                  const reparacionId = servicio.fields.Reparaciones 
                    ? (Array.isArray(servicio.fields.Reparaciones) 
                        ? servicio.fields.Reparaciones[0] 
                        : servicio.fields.Reparaciones)
                    : servicio.id
                  window.location.href = `/cita?id=${reparacionId}`
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Reprogramar Cita
              </button>
            </div>
          </>
        )}
        </TabsContent>

        <TabsContent value={"ubicacion"} className="space-y-4 mt-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-base font-semibold text-gray-900 mb-3">
              Ubicación
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-[#008606] mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Dirección</p>
                  <p className="text-sm font-medium text-gray-900">
                    {servicio.fields['Dirección'] || 'No especificada'}
                  </p>
                </div>
              </div>

              {(servicio.fields['Código postal'] || (Array.isArray(servicio.fields['Código postal']) && servicio.fields['Código postal'].length > 0)) && (
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5" /> {/* Espaciador para alineación */}
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Código Postal</p>
                    <p className="text-sm font-medium text-gray-900">
                      {Array.isArray(servicio.fields['Código postal']) 
                        ? servicio.fields['Código postal'][0] 
                        : servicio.fields['Código postal']}
                    </p>
                  </div>
                </div>
              )}

              {(servicio.fields['Población'] || servicio.fields['Población del cliente']) && (
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5" /> {/* Espaciador para alineación */}
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Población</p>
                    <p className="text-sm font-medium text-gray-900">
                      {Array.isArray(servicio.fields['Población del cliente']) 
                        ? servicio.fields['Población del cliente'][0] 
                        : servicio.fields['Población del cliente'] || servicio.fields['Población']}
                    </p>
                  </div>
                </div>
              )}

              {(servicio.fields['Provincia'] || (Array.isArray(servicio.fields['Provincia']) && servicio.fields['Provincia'].length > 0)) && (
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5" /> {/* Espaciador para alineación */}
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Provincia</p>
                    <p className="text-sm font-medium text-gray-900">
                      {Array.isArray(servicio.fields['Provincia']) 
                        ? servicio.fields['Provincia'][0] 
                        : servicio.fields['Provincia']}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {servicio.fields['Dirección'] && (
            <button
              onClick={() => {
                const direccion = servicio.fields['Dirección']
                const codigoPostal = Array.isArray(servicio.fields['Código postal']) 
                  ? servicio.fields['Código postal'][0] 
                  : servicio.fields['Código postal'] || ''
                const direccionCompleta = `${direccion} ${codigoPostal}`.trim()
                const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionCompleta)}`
                window.open(url, '_blank', 'noopener,noreferrer')
              }}
              className="w-full bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              Abrir en Google Maps
            </button>
          )}
        </TabsContent>

        <TabsContent value={"pasos"} className="space-y-4 mt-4">
          {servicio.fields['Motivo'] ? (() => {
            const motivoTecnico = servicio.fields['Motivo']
            const { pasos, requiereModelo } = getPasosResolucion(motivoTecnico, modeloCargador)
            
            return (
              <>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-3">
                    Pasos de Resolución
                  </h4>
                  
                  {requiereModelo && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">
                        Selecciona el modelo del cargador:
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setModeloCargador('Pulsar Max')}
                          className={`p-4 border-2 rounded-lg font-semibold text-sm transition-all ${
                            modeloCargador === 'Pulsar Max'
                              ? 'border-[#008606] bg-[#008606] text-white'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          Pulsar Max
                        </button>
                        <button
                          onClick={() => setModeloCargador('Pulsar Plus')}
                          className={`p-4 border-2 rounded-lg font-semibold text-sm transition-all ${
                            modeloCargador === 'Pulsar Plus'
                              ? 'border-[#008606] bg-[#008606] text-white'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          Pulsar Plus
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {(!requiereModelo || modeloCargador) && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-600 mb-2">
                        Motivo técnico: <span className="font-medium text-gray-900">{motivoTecnico}</span>
                      </p>
                    <ol className="space-y-3">
                      {pasos.map((paso, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-[#008606] text-white rounded-full flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </span>
                          <span className="text-sm text-gray-800 flex-1 pt-0.5">
                            {paso}
                          </span>
                        </li>
                      ))}
                    </ol>
                    </div>
                  )}
                </div>
              </>
            )
          })() : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <p className="text-sm text-gray-600">No hay motivo técnico especificado para este servicio</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
