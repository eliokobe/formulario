import { NextRequest, NextResponse } from 'next/server';
import { getServicioById, updateServicioRecord } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Se requiere el parámetro id' }, { status: 400 });
  }

  try {
    const record = await getServicioById(id);
    
    if (!record) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    const data = {
      id: record.id,
      Cliente: record.fields['Cliente'],
      Teléfono: record.fields['Teléfono'] || record.fields['Telefono'],
      Dirección: record.fields['Dirección'] || record.fields['Direccion'],
      'Tipo de servicio': record.fields['Tipo de servicio'] || record.fields['Tipo Servicio'] || record.fields['Servicio'],
      Descripción: record.fields['Descripción'] || record.fields['Detalles'] || record.fields['Problema'],
      Estado: record.fields['Estado'],
      'Cita técnico': record.fields['Cita técnico'] || record.fields['Cita'],
      'Técnico asignado': record.fields['Técnico asignado'] || record.fields['Trabajadores'],
      'Teléfono técnico': record.fields['Teléfono técnico'],
      'Observaciones cita': record.fields['Observaciones cita'],
      'Duración estimada (min)': record.fields['Duración estimada (min)'],
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al buscar servicio:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  console.log('🚀 PUT /api/servicios - Starting request');
  
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    console.log('❌ No id provided');
    return NextResponse.json({ error: 'Se requiere el parámetro id' }, { status: 400 });
  }

  try {
    console.log('📥 Parsing request body...');
    const body = await request.json();
    console.log('📥 Request body:', Object.keys(body));

    // Preparar los campos para actualizar en la tabla Servicios
    const fieldsToUpdate = {
      ...body,
    };

    // Si viene el campo "Cita técnico" en formato ISO, mantenerlo para Airtable
    if (body['Cita técnico']) {
      try {
        // Si es una fecha ISO válida, la usamos directamente (Airtable acepta ISO)
        const testDate = new Date(body['Cita técnico']);
        if (!isNaN(testDate.getTime())) {
          // Es una fecha válida en formato ISO, la mantenemos
          fieldsToUpdate['Cita técnico'] = body['Cita técnico'];
          console.log('📅 Using ISO format for Cita técnico:', fieldsToUpdate['Cita técnico']);
        } else {
          throw new Error('Invalid date format');
        }
      } catch (error) {
        console.log('⚠️ Invalid date format, using original:', body['Cita técnico']);
        fieldsToUpdate['Cita técnico'] = body['Cita técnico'];
      }
    }

    // Actualizar el servicio con los datos de la cita
    const updateResult = await updateServicioRecord(id, fieldsToUpdate);
    console.log('✅ Successfully updated servicio:', updateResult.id);
    console.log('✅ Cita técnico updated:', fieldsToUpdate['Cita técnico']);

    return NextResponse.json({ 
      success: true, 
      id: updateResult.id,
      message: 'Cita programada exitosamente',
      citaTecnico: fieldsToUpdate['Cita técnico']
    });

  } catch (error: any) {
    console.error('❌ Error updating servicio:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update servicio',
      details: error.message,
    }, { status: 500 });
  }
}