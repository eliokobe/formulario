import { NextRequest, NextResponse } from 'next/server';
import { getFormularioById, updateFormulario, createRepair } from '@/lib/airtable';

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
      'Reparaciones': record.fields['Reparaciones'],
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

    // Primero obtener el registro actual para acceder a la información necesaria
    const currentRecord = await getFormularioById(id);
    if (!currentRecord) {
      return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 });
    }

    console.log('📋 Current record fields:', Object.keys(currentRecord.fields));

    // Preparar los campos para actualizar en la tabla Formularios
    const fieldsToUpdate = {
      ...body,
    };

    let reparacionIdStr: string | undefined;

    // Si viene el campo "Cita" en formato ISO, mantenerlo para Airtable
    if (body['Cita']) {
      try {
        // Si es una fecha ISO válida, la usamos directamente (Airtable acepta ISO)
        const testDate = new Date(body['Cita']);
        if (!isNaN(testDate.getTime())) {
          // Es una fecha válida en formato ISO, la mantenemos
          fieldsToUpdate['Cita'] = body['Cita'];
          // Actualizar el Estado a 'Citado' cuando se programa una cita
          fieldsToUpdate['Estado'] = 'Citado';
          console.log('📅 Using ISO format for Cita:', fieldsToUpdate['Cita']);
          console.log('📝 Setting Estado to: Citado');

          // Crear registro en Reparaciones si aún no existe
          const existingReparacionId = currentRecord.fields['Reparaciones'];
          
          if (!existingReparacionId || (Array.isArray(existingReparacionId) && existingReparacionId.length === 0)) {
            console.log('🔨 Creating new Reparacion record...');
            
            // Preparar datos para crear la reparación
            const reparacionData: any = {};

            // Expediente - convertir a número
            if (currentRecord.fields['Expediente']) {
              const expedienteValue = currentRecord.fields['Expediente'];
              const expedienteNum = typeof expedienteValue === 'string' ? parseInt(expedienteValue, 10) : expedienteValue;
              if (!isNaN(expedienteNum)) {
                reparacionData['Expediente'] = expedienteNum;
              }
            }

            // Cliente - campo de texto simple
            if (currentRecord.fields['Cliente']) {
              const cliente = currentRecord.fields['Cliente'];
              // Si es un array, tomar el primer elemento, si no, usar el valor directamente
              reparacionData['Cliente'] = Array.isArray(cliente) ? cliente[0] : cliente;
            }

            // Dirección
            if (currentRecord.fields['Dirección']) {
              reparacionData['Dirección'] = currentRecord.fields['Dirección'];
            }

            // Servicios - linked record con el ID del servicio actual
            reparacionData['Servicios'] = [id];

            // Técnicos - obtener del campo Técnico en el servicio
            if (currentRecord.fields['Técnico']) {
              const tecnico = currentRecord.fields['Técnico'];
              reparacionData['Técnicos'] = Array.isArray(tecnico) ? tecnico : [tecnico];
            }

            console.log('🔨 Reparacion data to create:', reparacionData);

            // Crear el registro de reparación
            const newReparacion = await createRepair(reparacionData);
            console.log('✅ Reparacion created with ID:', newReparacion.id);
            
            reparacionIdStr = newReparacion.id;
            
            // Actualizar el formulario para vincular la reparación
            fieldsToUpdate['Reparaciones'] = [newReparacion.id];
          } else {
            // Ya existe una reparación, usar ese ID
            reparacionIdStr = Array.isArray(existingReparacionId) ? existingReparacionId[0] : existingReparacionId;
            console.log('ℹ️ Using existing Reparacion ID:', reparacionIdStr);
          }
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
      cita: fieldsToUpdate['Cita'],
      reparacionId: reparacionIdStr
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
