import { NextRequest, NextResponse } from 'next/server';
import { getFormularioById, updateFormulario } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Se requiere el parámetro id' }, { status: 400 });
  }

  try {
    const record = await getFormularioById(id);
    
    if (!record) {
      return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 });
    }

    const data = {
      id: record.id,
      Cliente: record.fields['Cliente'],
      Teléfono: record.fields['Teléfono'] || record.fields['Telefono'],
      Dirección: record.fields['Dirección'] || record.fields['Direccion'],
      'Potencia contratada en kW': record.fields['Potencia contratada en kW'] || record.fields['Potencia contratada'],
      'Fecha instalación': record.fields['Fecha instalación'],
      'Foto general': record.fields['Foto general'],
      'Foto etiqueta': record.fields['Foto etiqueta'],
      'Foto cuadro': record.fields['Foto cuadro'],
      'Foto roto': record.fields['Foto roto'],
      Detalles: record.fields['Detalles'],
      Cita: record.fields['Cita'],
      Trabajadores: record.fields['Trabajadores'],
      'Técnico asignado': record.fields['Técnico asignado'],
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al buscar formulario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  console.log('🚀 PUT /api/formularios - Starting request');
  
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

    // Preparar los campos para actualizar en la tabla Formularios
    const fieldsToUpdate = {
      ...body,
    };

    // Si viene el campo "Cita" en formato ISO, mantenerlo para Airtable
    if (body['Cita']) {
      try {
        // Si es una fecha ISO válida, la usamos directamente (Airtable acepta ISO)
        const testDate = new Date(body['Cita']);
        if (!isNaN(testDate.getTime())) {
          // Es una fecha válida en formato ISO, la mantenemos
          fieldsToUpdate['Cita'] = body['Cita'];
          console.log('📅 Using ISO format for Cita:', fieldsToUpdate['Cita']);
        } else {
          throw new Error('Invalid date format');
        }
      } catch (error) {
        console.log('⚠️ Invalid date format, using original:', body['Cita']);
        fieldsToUpdate['Cita'] = body['Cita'];
      }
    }

    // Actualizar el formulario con los datos de la cita
    const updateResult = await updateFormulario(id, fieldsToUpdate);
    console.log('✅ Successfully updated formulario:', updateResult.id);
    console.log('✅ Cita updated:', fieldsToUpdate['Cita']);

    return NextResponse.json({ 
      success: true, 
      id: updateResult.id,
      message: 'Cita programada exitosamente',
      cita: fieldsToUpdate['Cita']
    });

  } catch (error: any) {
    console.error('❌ Error updating formulario:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update formulario',
      details: error.message,
    }, { status: 500 });
  }
}
