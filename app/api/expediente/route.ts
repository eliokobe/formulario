import { NextRequest, NextResponse } from 'next/server';
import { findFormularioByExpediente, getFormularioById, updateFormulario, uploadImageToAirtable, updateServicioRecord } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const recordId = searchParams.get('record');
  const expediente = searchParams.get('expediente');

  console.log('📥 GET /api/expediente - Parameters:', { id, recordId, expediente });

  if (!id && !recordId && !expediente) {
    return NextResponse.json({ error: 'Se requiere id, record o expediente' }, { status: 400 });
  }

  try {
    let record;
    
    if (id || recordId) {
      // Buscar por ID (priorizar 'id' sobre 'record')
      const targetId = id || recordId;
      if (!targetId) {
        return NextResponse.json({ error: 'ID no válido' }, { status: 400 });
      }
      console.log('🔍 Fetching record by ID:', targetId);
      record = await getFormularioById(targetId);
      console.log('✅ Record fetched:', record ? 'Found' : 'Not found');
      if (!record) {
        return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
      }
    } else {
      // Buscar por expediente (mantener compatibilidad)
      console.log('🔍 Fetching record by expediente:', expediente);
      const records = await findFormularioByExpediente(expediente!);
      if (records.length === 0) {
        return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
      }
      record = records[0];
    }

    const data = {
      id: record.id,
      expediente: record.fields['Expediente'],
      cliente: record.fields['Cliente'],
      telefono: record.fields['Teléfono'],
      direccion: record.fields['Dirección'],
      potenciaContratada: record.fields['Potencia contratada'],
      fechaInstalacion: record.fields['Fecha instalación'],
      fotoGeneral: record.fields['Foto general'],
      fotoEtiqueta: record.fields['Foto etiqueta'],
      fotoCuadroElectrico: record.fields['Foto cuadro'],
      detalles: record.fields['Detalles'],
      fotoRoto: record.fields['Foto roto'],
      cita: record.fields['Cita'], // Incluir la cita existente
    };

    console.log('✅ Returning data for expediente:', data.expediente);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error al buscar expediente:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  console.log('🚀 PUT /api/expediente - Starting request');
  
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const recordId = searchParams.get('record');
  const expediente = searchParams.get('expediente');
  console.log('📋 Parameters - ID:', id, 'Record:', recordId, 'Expediente:', expediente);

  if (!id && !recordId && !expediente) {
    console.log('❌ No id, record or expediente provided');
    return NextResponse.json({ error: 'Se requiere id, record o expediente' }, { status: 400 });
  }

  try {
    console.log('📥 Parsing request body...');
    const body = await request.json();
    console.log('📥 Request body size:', JSON.stringify(body).length, 'characters');
    console.log('📥 Request body keys:', Object.keys(body));
    
    // Check if there are large base64 images
    Object.keys(body).forEach(key => {
      if (typeof body[key] === 'string' && body[key].startsWith('data:image/')) {
        console.log(`📸 Found image in ${key}: ${body[key].substring(0, 50)}...`);
        console.log(`📸 Image size: ${body[key].length} characters`);
      } else if (Array.isArray(body[key])) {
        console.log(`📸 Found array in ${key} with ${body[key].length} items`);
        console.log(`📸 Array structure:`, JSON.stringify(body[key], null, 2));
      }
    });

    let targetRecordId: string;
    
    if (id || recordId) {
      // Usar el ID directamente (priorizar 'id' sobre 'record')
      const targetId = id || recordId;
      if (!targetId) {
        console.log('❌ Invalid ID provided');
        return NextResponse.json({ error: 'ID no válido' }, { status: 400 });
      }
      targetRecordId = targetId;
      console.log('✅ Using ID directly:', targetRecordId);
    } else {
      // Buscar por expediente (mantener compatibilidad)
      console.log('🔍 Searching for expediente in Airtable...');
      const records = await findFormularioByExpediente(expediente!);
      console.log('🔍 Found records:', records.length);

      if (records.length === 0) {
        console.log('❌ Expediente not found in database');
        return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
      }
      targetRecordId = records[0].id;
      console.log('✅ Found record ID:', targetRecordId);
    }

    // Preparar campos de texto para actualizar
    const fieldsToUpdate: any = {};
    
    console.log('🔧 Preparing text fields to update...');
    if (body['Cliente']) {
      console.log('📝 Processing Cliente');
      fieldsToUpdate['Cliente'] = body['Cliente'];
    }
    if (body['Teléfono']) {
      console.log('📝 Processing Teléfono');
      fieldsToUpdate['Teléfono'] = body['Teléfono'];
    }
    if (body['Dirección']) {
      console.log('📝 Processing Dirección');
      fieldsToUpdate['Dirección'] = body['Dirección'];
    }
    if (body['Potencia contratada en kW']) {
      console.log('📝 Processing Potencia contratada');
      fieldsToUpdate['Potencia contratada'] = body['Potencia contratada en kW'];
    }
    if (body['Fecha instalación']) {
      console.log('📝 Processing Fecha instalación');
      fieldsToUpdate['Fecha instalación'] = body['Fecha instalación'];
    }
    if (body['Detalles']) {
      console.log('📝 Processing Detalles');
      fieldsToUpdate['Detalles'] = body['Detalles'];
    }
    if (body['Cita']) {
      console.log('📝 Processing Cita:', body['Cita']);
      fieldsToUpdate['Cita'] = body['Cita'];
    }
    
    // No actualizamos fecha automáticamente porque el campo no existe en Airtable
    console.log('⏭️ Skipping timestamp - field does not exist in Airtable');

    console.log('🔧 Text fields to update keys:', Object.keys(fieldsToUpdate));

    // Actualizar campos de texto primero
    let updatedRecord;
    if (Object.keys(fieldsToUpdate).length > 0) {
      console.log('💾 Updating text fields in Airtable...');
      updatedRecord = await updateFormulario(targetRecordId, fieldsToUpdate);
      console.log('✅ Text fields updated successfully');
    }

    // Subir imágenes usando el endpoint específico de Airtable
    if (body['Foto general'] && Array.isArray(body['Foto general']) && body['Foto general'].length > 0) {
      console.log('📸 Uploading Foto general...');
      await uploadImageToAirtable(targetRecordId, 'Foto general', body['Foto general'][0]);
    }
    
    if (body['Foto etiqueta'] && Array.isArray(body['Foto etiqueta']) && body['Foto etiqueta'].length > 0) {
      console.log('🏷️ Uploading Foto etiqueta...');
      await uploadImageToAirtable(targetRecordId, 'Foto etiqueta', body['Foto etiqueta'][0]);
    }

    if (body['Foto cuadro'] && Array.isArray(body['Foto cuadro']) && body['Foto cuadro'].length > 0) {
      console.log('⚡ Uploading Foto cuadro...');
      await uploadImageToAirtable(targetRecordId, 'Foto cuadro', body['Foto cuadro'][0]);
    }

    if (body['Foto roto'] && Array.isArray(body['Foto roto']) && body['Foto roto'].length > 0) {
      console.log('🔴 Uploading Foto roto...');
      await uploadImageToAirtable(targetRecordId, 'Foto roto', body['Foto roto'][0]);
    }

    // Sincronizar Estado y Cita en la tabla Servicios usando la relación en Formularios
    try {
      const formularioRecord = await getFormularioById(targetRecordId);
      const servicioLinkPlural = formularioRecord?.fields?.['Servicios'];
      const servicioLinkSingular = formularioRecord?.fields?.['Servicio'];

      const servicioId = Array.isArray(servicioLinkPlural) && servicioLinkPlural.length > 0
        ? servicioLinkPlural[0]
        : Array.isArray(servicioLinkSingular) && servicioLinkSingular.length > 0
          ? servicioLinkSingular[0]
          : undefined;

      if (servicioId) {
        const fieldsToSync: Record<string, any> = { Estado: 'Citado' };
        if (body['Cita']) {
          fieldsToSync.Cita = body['Cita'];
        }

        await updateServicioRecord(servicioId, fieldsToSync);
        console.log(`✅ Sincronización en Servicios (${servicioId}) completada`, Object.keys(fieldsToSync));
      } else {
        console.log('ℹ️ No se encontró un Servicio(s) vinculado para sincronizar la Cita/Estado');
      }
    } catch (syncError: any) {
      console.error('❌ Error al sincronizar datos en Servicios:', syncError);
      return NextResponse.json({
        error: 'Registro actualizado, pero no se pudo sincronizar Servicios',
        details: syncError.message,
      }, { status: 500 });
    }
    console.log('✅ Record updated successfully');

    return NextResponse.json({ 
      success: true, 
      recordId: targetRecordId,
    });
  } catch (error: any) {
    console.error('❌ DETAILED ERROR in PUT /api/expediente:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    // If it's an Airtable-specific error, provide more details
    if (error.message && error.message.includes('Airtable')) {
      console.error('🔍 This appears to be an Airtable API error');
    }
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message,
      type: error.name
    }, { status: 500 });
  }
}
