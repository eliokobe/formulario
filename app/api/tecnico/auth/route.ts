import { NextRequest, NextResponse } from 'next/server'

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const AIRTABLE_TABLE_TECNICOS = 'Técnicos'

export async function POST(request: NextRequest) {
  try {
    const { telefono } = await request.json()

    console.log('=== INICIO AUTENTICACIÓN TÉCNICO ===')
    console.log('Teléfono recibido:', telefono)

    if (!telefono) {
      return NextResponse.json(
        { error: 'Número de teléfono requerido' },
        { status: 400 }
      )
    }

    // Log de variables de entorno (sin exponer los valores completos)
    console.log('AIRTABLE_TOKEN:', AIRTABLE_TOKEN ? `${AIRTABLE_TOKEN.substring(0, 10)}...` : 'NO CONFIGURADO')
    console.log('AIRTABLE_BASE_ID:', AIRTABLE_BASE_ID || 'NO CONFIGURADO')

    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
      console.error('❌ Missing Airtable credentials')
      console.error('AIRTABLE_TOKEN exists:', !!AIRTABLE_TOKEN)
      console.error('AIRTABLE_BASE_ID exists:', !!AIRTABLE_BASE_ID)
      return NextResponse.json(
        { error: 'Error de configuración del servidor. Las variables de entorno de Airtable no están configuradas.' },
        { status: 500 }
      )
    }

    // Normalizar teléfono para búsqueda
    const normalizeTelefono = (tel: string) => tel.replace(/[\s\-()]/g, '')
    const telefonoNormalizado = normalizeTelefono(telefono)

    console.log('Teléfono normalizado:', telefonoNormalizado)
    console.log('Buscando en tabla:', AIRTABLE_TABLE_TECNICOS)

    // Obtener todos los técnicos y buscar localmente
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_TECNICOS)}`
    console.log('URL de Airtable:', url)
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('Respuesta de Airtable:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Airtable API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Error al buscar técnico en Airtable (${response.status})` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✓ Técnicos encontrados en Airtable:', data.records.length)
    
    if (!data.records || data.records.length === 0) {
      console.log('❌ No hay técnicos en la tabla')
      return NextResponse.json(
        { error: 'No hay técnicos registrados en el sistema.' },
        { status: 404 }
      )
    }

    // Log de los teléfonos de todos los técnicos para debug
    console.log('Teléfonos en la base de datos:')
    data.records.forEach((record: any, index: number) => {
      const tel = record.fields?.['Teléfono'] || record.fields?.['telefono'] || record.fields?.['Telefono']
      const nombre = record.fields?.['Nombre'] || record.fields?.['nombre']
      console.log(`  ${index + 1}. ${nombre || 'Sin nombre'}: ${tel || 'Sin teléfono'} (normalizado: ${tel ? normalizeTelefono(String(tel)) : 'N/A'})`)
    })

    // Buscar el técnico que coincida con el teléfono
    const tecnico = data.records.find((record: any) => {
      const tecnicoTel = record.fields?.['Teléfono'] || record.fields?.['telefono'] || record.fields?.['Telefono']
      if (!tecnicoTel) return false
      
      const tecnicoTelNormalizado = normalizeTelefono(String(tecnicoTel))
      const match = tecnicoTelNormalizado === telefonoNormalizado
      
      if (match) {
        console.log('✓ COINCIDENCIA ENCONTRADA:', tecnicoTel, '->', tecnicoTelNormalizado)
      }
      
      return match
    })

    if (!tecnico) {
      console.log('❌ Teléfono no encontrado:', telefonoNormalizado)
      return NextResponse.json(
        { error: `Número de teléfono ${telefono} no encontrado. Verifica que estés registrado como técnico.` },
        { status: 404 }
      )
    }

    console.log('✓ Técnico encontrado:', tecnico.id, tecnico.fields?.Nombre)
    console.log('=== FIN AUTENTICACIÓN EXITOSA ===')

    // Autenticación exitosa
    return NextResponse.json({
      success: true,
      tecnico: {
        id: tecnico.id,
        fields: tecnico.fields,
      },
    })

  } catch (error: any) {
    console.error('❌ ERROR CRÍTICO en autenticación de técnico:', error)
    console.error('Stack:', error.stack)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}
