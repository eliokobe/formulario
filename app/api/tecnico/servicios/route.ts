import { NextRequest, NextResponse } from 'next/server'
import { updateServicioRecord, getRepairById, getServicioById } from '@/lib/airtable'

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const AIRTABLE_TABLE_TECNICOS = 'Técnicos'
const AIRTABLE_TABLE_REPARACIONES = process.env.AIRTABLE_TABLE_REPARACIONES || 'Reparaciones'

// Helper function to fetch with retries
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Intento ${i + 1}/${retries} para: ${url}`)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      return response
    } catch (error: any) {
      console.error(`Error en intento ${i + 1}:`, error.message)
      if (i === retries - 1) throw error
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error('Max retries reached')
}

// GET - Obtener reparaciones asignadas a un técnico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tecnicoTelefono = searchParams.get('telefono')

    console.log('=== OBTENIENDO REPARACIONES DEL TÉCNICO ===')
    console.log('Teléfono técnico:', tecnicoTelefono)

    if (!tecnicoTelefono) {
      return NextResponse.json(
        { error: 'Teléfono de técnico no proporcionado' },
        { status: 400 }
      )
    }

    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
      console.error('Missing Airtable credentials')
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    // Buscar reparaciones donde:
    // 1. La columna "Técnicos" (linked record) tiene un registro con el teléfono del técnico
    // 2. El Estado es uno de: "Asignado", "Aceptado", "Citado", "Reparado", "No reparado"
    // 3. La Fecha creación no tiene más de 30 días de antigüedad
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000))
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString().split('T')[0]
    
    const filterFormula = `AND(
      FIND("${tecnicoTelefono}", ARRAYJOIN({Teléfono técnico})),
      OR(
        {Estado} = "Asignado",
        {Estado} = "Aceptado",
        {Estado} = "Citado",
        {Estado} = "Reparado",
        {Estado} = "No reparado"
      ),
      IS_AFTER({Fecha creación}, "${thirtyDaysAgoISO}")
    )`

    console.log('Filtro de búsqueda:', filterFormula)

    // Incluir campos expandidos para obtener la población del cliente, factura y datos de Servicios
    const fieldsParam = encodeURIComponent('fields[]=Cliente&fields[]=Población del cliente&fields[]=Estado&fields[]=Tipo de Servicio&fields[]=Dirección&fields[]=Teléfono&fields[]=Email&fields[]=Fecha de Servicio&fields[]=Descripción&fields[]=Notas Técnico&fields[]=Enlace Cita&fields[]=Cita técnico&fields[]=ID Cliente&fields[]=Reparaciones&fields[]=Teléfono técnico&fields[]=Factura&fields[]=Servicios&fields[]=Motivo&fields[]=Provincia&fields[]=Código postal')
    const reparacionesUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_REPARACIONES)}?filterByFormula=${encodeURIComponent(filterFormula)}`
    console.log('Buscando reparaciones en:', AIRTABLE_TABLE_REPARACIONES)
    
    const response = await fetchWithRetry(reparacionesUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error fetching reparaciones:', response.status, errorText)
      return NextResponse.json(
        { error: 'Error al obtener reparaciones' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log(`✓ Reparaciones encontradas: ${data.records.length}`)

    // Log de las reparaciones encontradas
    data.records.forEach((reparacion: any, index: number) => {
      const clienteName = Array.isArray(reparacion.fields['Cliente']) 
        ? reparacion.fields['Cliente'][0] 
        : reparacion.fields['Cliente'] || 'Sin nombre'
      console.log(`  ${index + 1}. ${clienteName} - Estado: ${reparacion.fields.Estado || 'Sin estado'}`)
    })

    console.log('=== FIN OBTENCIÓN DE REPARACIONES ===')

    return NextResponse.json({
      success: true,
      servicios: data.records,
    })

  } catch (error: any) {
    console.error('❌ Error al obtener reparaciones del técnico:', error)
    console.error('Stack:', error.stack)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar estado o notas de una reparación
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { servicioId, estado, notas, generarEnlaceCita } = body
    
    console.log('🔧 PATCH Request Body:', JSON.stringify(body, null, 2))
    console.log('📋 servicioId:', servicioId)
    console.log('📋 generarEnlaceCita:', generarEnlaceCita)

    if (!servicioId) {
      return NextResponse.json(
        { error: 'ID de reparación no proporcionado' },
        { status: 400 }
      )
    }

    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
      console.error('Missing Airtable credentials')
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    // Construir el objeto de campos a actualizar
    const fieldsToUpdate: any = {}

    if (estado !== undefined) {
      fieldsToUpdate['Estado'] = estado
    }

    if (notas !== undefined) {
      fieldsToUpdate['Notas Técnico'] = notas
    }

    // Si se solicita generar enlace de cita
    if (generarEnlaceCita) {
      // Generar el enlace de cita usando el ID de la reparación
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://formulario.ritest.es'
      const enlaceCita = `${baseUrl}/cita?id=${servicioId}`
      fieldsToUpdate['Enlace Cita'] = enlaceCita
      console.log('📅 Generando enlace de cita:', enlaceCita)
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    // Actualizar la reparación en Airtable
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_REPARACIONES)}/${servicioId}`
    
    console.log('🔄 Actualizando registro en Airtable:')
    console.log('  URL:', url)
    console.log('  Campos a actualizar:', JSON.stringify(fieldsToUpdate, null, 2))
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: fieldsToUpdate,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error updating reparacion:', response.status, errorText)
      return NextResponse.json(
        { error: 'Error al actualizar reparación', details: errorText },
        { status: response.status }
      )
    }

    const updatedReparacion = await response.json()

    // Si el estado es "Rechazado", actualizar la tabla Servicios a "Pendiente de asignar"
    if (estado === 'Rechazado') {
      try {
        console.log('🔄 Estado Rechazado detectado, actualizando tabla Servicios...')
        
        // Obtener el registro de Reparaciones para conseguir el ID de Servicios
        const repairRecord = await getRepairById(servicioId)
        console.log('📋 Registro de Reparaciones:', JSON.stringify(repairRecord, null, 2))
        
        // El campo Servicios contiene el array con el record ID de Servicios
        const serviciosIds = repairRecord?.fields?.['Servicios']
        
        if (serviciosIds && Array.isArray(serviciosIds) && serviciosIds.length > 0) {
          const servicioRecordId = serviciosIds[0] // Tomar el primer ID
          console.log('🎯 ID de Servicios encontrado:', servicioRecordId)
          
          // Obtener el registro actual de Servicios para obtener el técnico asignado
          const servicioRecord = await getServicioById(servicioRecordId)
          console.log('📋 Registro de Servicios actual:', JSON.stringify(servicioRecord, null, 2))
          
          const tecnicoActual = servicioRecord?.fields?.['Técnico'] // Array de IDs de técnicos
          const tecnicosIntentados = servicioRecord?.fields?.['Técnicos intentados'] || [] // Array existente
          
          // Preparar la actualización
          const updateData: Record<string, any> = {
            'Estado': 'Pendiente de asignar',
            'Técnico': [] // Limpiar el técnico actual
          }
          
          // Si hay un técnico asignado, moverlo a Técnicos intentados
          if (tecnicoActual && Array.isArray(tecnicoActual) && tecnicoActual.length > 0) {
            // Agregar el técnico actual a la lista de técnicos intentados (evitando duplicados)
            const tecnicosSet = new Set([...tecnicosIntentados, ...tecnicoActual])
            const nuevosTecnicosIntentados = Array.from(tecnicosSet)
            updateData['Técnicos intentados'] = nuevosTecnicosIntentados
            console.log('👤 Moviendo técnico de "Técnico" a "Técnicos intentados":', tecnicoActual)
          }
          
          // Actualizar el registro en la tabla Servicios
          await updateServicioRecord(servicioRecordId, updateData)
          
          console.log('✅ Tabla Servicios actualizada exitosamente:', updateData)
        } else {
          console.warn('⚠️ No se encontró el ID de Servicios en el registro de Reparaciones')
        }
      } catch (servicioError: any) {
        console.error('❌ Error al actualizar la tabla Servicios:', servicioError)
        // No lanzar el error para no bloquear la respuesta principal
        // La reparación se guardó correctamente con estado Rechazado
      }
    }

    return NextResponse.json({
      success: true,
      servicio: updatedReparacion,
      enlaceCita: fieldsToUpdate['Enlace Cita'],
    })

  } catch (error: any) {
    console.error('Error al actualizar reparación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}
