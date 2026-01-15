import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { 
  createRepair, 
  findRepairByExpediente,
  getRepairById, 
  updateRepairRecord, 
  uploadImageToAirtable,
  updateServicioRecord,
  getServicioById,
  createEnvio
} from '@/lib/airtable';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    console.log('🔧 Environment check:');
    console.log('AIRTABLE_TOKEN:', process.env.AIRTABLE_TOKEN ? 'Set' : 'Missing');
    
    const body = await request.json();
    console.log('📥 Request body:', JSON.stringify(body, null, 2));
    
    const resultado = typeof body.Estado === 'string' ? body.Estado.trim() : '';
    const reparacion = typeof body.Reparación === 'string' ? body.Reparación.trim() : '';
    const material = typeof body.Material === 'string' ? body.Material.trim() : '';
    const detalles = typeof body.Detalles === 'string' ? body.Detalles.trim() : '';

    // Validation - only require essential fields
    if (!resultado) {
      return NextResponse.json(
        { error: 'El campo Estado es obligatorio' },
        { status: 400 }
      );
    }

    if (!['Reparado', 'No reparado'].includes(resultado)) {
      return NextResponse.json(
        { error: 'Valor de Estado no válido' },
        { status: 400 }
      );
    }

    if (!body.Cliente || !body.Técnico) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: Cliente y Técnico son obligatorios' },
        { status: 400 }
      );
    }

    if (resultado === 'Reparado' && !reparacion) {
      return NextResponse.json(
        { error: 'Selecciona el tipo de reparación realizada' },
        { status: 400 }
      );
    }

    if (resultado === 'Reparado' && (reparacion === 'Reparar el cuadro eléctrico' || reparacion === 'Sustituir el punto de recarga') && !material) {
      return NextResponse.json(
        { error: 'Selecciona el material utilizado' },
        { status: 400 }
      );
    }

    if (resultado === 'Reparado' && reparacion === 'Sustituir el punto de recarga') {
      const numeroSerie = body['Número de serie'];
      if (!numeroSerie || (typeof numeroSerie === 'number' && isNaN(numeroSerie))) {
        return NextResponse.json(
          { error: 'El número de serie es requerido al sustituir el punto de recarga' },
          { status: 400 }
        );
      }
    }

    if (!detalles) {
      return NextResponse.json(
        { error: 'Los detalles de la reparación son obligatorios' },
        { status: 400 }
      );
    }

    body.Estado = resultado;
    // Only set select fields if they have values, otherwise don't include them
    body.Reparación = reparacion || undefined;
    body.Material = material || undefined;
    body.Detalles = detalles;

    // Create the repair record
    const result = await createRepair(body);
    
    // Check and create Envío if needed
    await checkAndCreateEnvio(result.id, resultado, reparacion);

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error: any) {
    console.error('Repair API error:', error);
    const message = typeof error?.message === 'string' ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('record') || searchParams.get('id');
    const expediente = searchParams.get('expediente');

    if (!recordId && !expediente) {
      return NextResponse.json({ error: 'Se requiere record/id o expediente' }, { status: 400 });
    }

    let record;
    
    if (recordId) {
      // Buscar por record ID directamente
      record = await getRepairById(recordId);
      if (!record) {
        return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
      }
    } else {
      // Buscar por expediente (mantener compatibilidad)
      const records = await findRepairByExpediente(expediente!);
      if (records.length === 0) {
        return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
      }
      record = records[0];
    }

    const fields = record.fields || {};

    return NextResponse.json({
      id: record.id,
      expediente: fields['Expediente'] || '',
      tecnico: fields['Técnico'] || '',
      'Técnico asignado': fields['Técnico'] || fields['Técnicos'] || '',
      'Técnicos': fields['Técnicos'] || fields['Técnico'] || '',
      Trabajadores: fields['Técnicos'] || fields['Técnico'] || '',
      cliente: fields['Cliente'] || '',
      Cliente: fields['Cliente'] || '',
      direccion: fields['Dirección'] || '',
      Dirección: fields['Dirección'] || '',
      telefono: Array.isArray(fields['Teléfono']) ? fields['Teléfono'][0] : (fields['Teléfono'] || ''),
      Teléfono: Array.isArray(fields['Teléfono']) ? fields['Teléfono'][0] : (fields['Teléfono'] || ''),
      resultado: fields['Estado'] || '',
      reparacion: fields['Reparación'] || '',
      material: fields['Material'] || fields['Cuadro eléctrico'] || '', // Usar Material, con fallback a Cuadro eléctrico para compatibilidad
      cuadroElectrico: fields['Cuadro eléctrico'] || '', // Mantener para compatibilidad
      detalles: fields['Detalles'] || '',
      problema: fields['Problema'] || '', // Mantener para compatibilidad con datos existentes
      numeroSerie: fields['Número de serie'] || '',
      factura: fields['Factura'] || [],
      foto: fields['Foto'] || [],
      fotoEtiqueta: fields['Foto de la etiqueta'] || [],
      Cita: fields['Cita'] || '',
      Estado: fields['Estado'] || '',
    });
  } catch (error: any) {
    console.error('Get repairs error:', error);
    return NextResponse.json(
      { error: 'Error al obtener reparaciones' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get('record') || searchParams.get('id');
  const expediente = searchParams.get('expediente');

  if (!recordId && !expediente) {
    return NextResponse.json({ error: 'Se requiere record/id o expediente' }, { status: 400 });
  }

  try {
    const body = await request.json();

    let targetRecordId: string;
    
    if (recordId) {
      // Usar el record ID directamente
      targetRecordId = recordId;
    } else {
      // Buscar por expediente (mantener compatibilidad)
      const records = await findRepairByExpediente(expediente!);
      if (records.length === 0) {
        return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
      }
      targetRecordId = records[0].id;
    }

    const fieldsToUpdate: Record<string, any> = {};

    // Define fields that are select/multiple-select in Airtable
    const selectFields = ['Reparación', 'Material', 'Estado'];
    
    const textFields: Array<[string, string]> = [
      ['Estado', 'Estado'],
      ['Reparación', 'Reparación'],
      ['Material', 'Material'],
      ['Detalles', 'Detalles'],
      ['Técnico', 'Técnico'],
      ['Cliente', 'Cliente'],
      ['Dirección', 'Dirección'],
      ['Estado', 'Estado'],
    ];

    textFields.forEach(([bodyKey, airtableField]) => {
      if (bodyKey in body) {
        const value = body[bodyKey];
        if (typeof value === 'string') {
          const trimmed = value.trim();
          // For select fields, only add if not empty, otherwise set to null to clear
          if (selectFields.includes(airtableField)) {
            if (trimmed.length > 0) {
              fieldsToUpdate[airtableField] = trimmed;
            } else {
              fieldsToUpdate[airtableField] = null;
            }
          } else {
            // For text fields, use empty string if trimmed is empty
            fieldsToUpdate[airtableField] = trimmed;
          }
        }
      }
    });

    // Handle Número de serie separately as it's a number field
    if ('Número de serie' in body) {
      const numeroSerie = body['Número de serie'];
      if (typeof numeroSerie === 'number' && !isNaN(numeroSerie)) {
        fieldsToUpdate['Número de serie'] = numeroSerie;
      } else if (numeroSerie === null || numeroSerie === undefined) {
        fieldsToUpdate['Número de serie'] = null;
      }
    }

    // Handle Cita field (date/time field in ISO format)
    if ('Cita' in body) {
      const cita = body['Cita'];
      if (typeof cita === 'string') {
        try {
          // Validate that it's a proper date
          const testDate = new Date(cita);
          if (!isNaN(testDate.getTime())) {
            fieldsToUpdate['Cita'] = cita;
          }
        } catch (error) {
          console.log('⚠️ Invalid Cita date format, skipping');
        }
      } else if (cita === null || cita === undefined) {
        fieldsToUpdate['Cita'] = null;
      }
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await updateRepairRecord(targetRecordId, fieldsToUpdate);
    }
    
    // Check and create Envío if needed
    if (fieldsToUpdate['Estado'] && fieldsToUpdate['Reparación']) {
      await checkAndCreateEnvio(targetRecordId, fieldsToUpdate['Estado'], fieldsToUpdate['Reparación']);
    }

    // Actualizar la tabla Servicios según el estado
    if (fieldsToUpdate['Estado'] === 'Reparado' || fieldsToUpdate['Estado'] === 'No reparado') {
      try {
        const estadoTexto = fieldsToUpdate['Estado'] === 'Reparado' ? 'Reparado' : 'No reparado';
        console.log(`🔄 Estado ${estadoTexto} detectado, actualizando tabla Servicios...`);
        
        // Obtener el registro de Reparaciones para conseguir el ID de Servicios
        const repairRecord = await getRepairById(targetRecordId);
        console.log('📋 Registro de Reparaciones:', JSON.stringify(repairRecord, null, 2));
        
        // El campo Servicios contiene el array con el record ID de Servicios
        const serviciosIds = repairRecord?.fields?.['Servicios'];
        
        if (serviciosIds && Array.isArray(serviciosIds) && serviciosIds.length > 0) {
          const servicioRecordId = serviciosIds[0]; // Tomar el primer ID
          console.log('🎯 ID de Servicios encontrado:', servicioRecordId);
          
          // Preparar datos de actualización según el estado
          const servicioUpdateData: Record<string, string> = {};
          
          if (fieldsToUpdate['Estado'] === 'Reparado') {
            servicioUpdateData['Estado'] = 'Finalizado';
            servicioUpdateData['Resolución visita'] = 'Presencial';
          } else if (fieldsToUpdate['Estado'] === 'No reparado') {
            servicioUpdateData['Estado'] = 'Pendiente revisión';
          }
          
          // Actualizar el registro en la tabla Servicios
          await updateServicioRecord(servicioRecordId, servicioUpdateData);
          
          console.log('✅ Tabla Servicios actualizada exitosamente con:', servicioUpdateData);
        } else {
          console.warn('⚠️ No se encontró el ID de Servicios en el registro de Reparaciones');
        }
      } catch (servicioError: any) {
        console.error('❌ Error al actualizar la tabla Servicios:', servicioError);
        // No lanzar el error para no bloquear la respuesta principal
        // La reparación se guardó correctamente
      }
    }

    const attachmentFields: Array<[string, string]> = [
      ['Foto', 'Foto'],
      ['Factura', 'Factura'],
      ['Foto de la etiqueta', 'Foto de la etiqueta'],
    ];

    for (const [bodyKey, airtableField] of attachmentFields) {
      const attachments = Array.isArray(body[bodyKey]) ? body[bodyKey] : [];
      if (attachments.length > 0) {
        // Clear existing attachments before uploading new ones
        await updateRepairRecord(targetRecordId, { [airtableField]: [] });

        for (const attachment of attachments) {
          await uploadImageToAirtable(targetRecordId, airtableField, attachment);
        }
      }
    }

    return NextResponse.json({ success: true, recordId: targetRecordId });
  } catch (error: any) {
    console.error('Update repair error:', error);
    const message = typeof error?.message === 'string' ? error.message : 'Error al actualizar la reparación';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function checkAndCreateEnvio(recordId: string, estado: string, reparacion: string) {
  if (estado === 'Reparado' && reparacion === 'Sustituir el punto de recarga') {
    console.log('📦 Creating Envio record...');
    try {
      const repairRecord = await getRepairById(recordId);
      const serviciosIds = repairRecord?.fields?.['Servicios'];
      
      if (serviciosIds && Array.isArray(serviciosIds) && serviciosIds.length > 0) {
        const servicioId = serviciosIds[0];
        const servicioRecord = await getServicioById(servicioId);
        const sFields = servicioRecord.fields || {};
        
        const envioData = {
          'Cliente': repairRecord.fields['Cliente'],
          'Dirección': repairRecord.fields['Dirección'],
          'Población': sFields['Población'],
          'Código postal': sFields['Código postal'],
          'Provincia': sFields['Provincia postal'],
          'Teléfono': sFields['Teléfono postal'],
          'Transporte': 'Inbound Logística',
          'Estado': 'Pendiente recogida',
          'Servicio': [servicioId]
        };
        
        await createEnvio(envioData);
        console.log('✅ Envio created successfully');
      } else {
        console.log('⚠️ Could not create Envio: No Servicio linked');
      }
    } catch (error) {
      console.error('❌ Error creating Envio:', error);
    }
  }
}
