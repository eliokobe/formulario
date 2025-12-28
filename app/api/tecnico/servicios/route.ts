import { NextRequest, NextResponse } from 'next/server'

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
    const filterFormula = `AND(
      FIND("${tecnicoTelefono}", ARRAYJOIN({Teléfono técnico})),
      OR(
        {Estado} = "Asignado",
        {Estado} = "Aceptado",
        {Estado} = "Citado",
        {Estado} = "Reparado",
        {Estado} = "No reparado"
      )
    )`

    console.log('Filtro de búsqueda:', filterFormula)

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
    const { servicioId, estado, notas, generarEnlaceCita, clienteId } = await request.json()

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
    if (generarEnlaceCita && clienteId) {
      // Generar el enlace de cita (ajusta la URL según tu dominio)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://formulario.ritest.es'
      const enlaceCita = `${baseUrl}/cita?id=${clienteId}`
      fieldsToUpdate['Enlace Cita'] = enlaceCita
      fieldsToUpdate['Estado'] = 'Aceptado'
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    // Actualizar la reparación en Airtable
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_REPARACIONES)}/${servicioId}`
    
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
      console.error('Error updating reparacion:', response.status, errorText)
      return NextResponse.json(
        { error: 'Error al actualizar reparación' },
        { status: response.status }
      )
    }

    const updatedReparacion = await response.json()

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
