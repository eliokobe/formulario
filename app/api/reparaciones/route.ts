import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { 
  createServicio, 
  findServicioByExpediente,
  getServicioById, 
  updateServicioRecord, 
  uploadImageToServiciosAirtable 
} from '@/lib/airtable';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 Request body:', JSON.stringify(body, null, 2));
    
    // Verificar que tenemos un recordId
    if (!body.recordId) {
      return NextResponse.json(
        { error: 'Se requiere recordId para actualizar el registro existente' },
        { status: 400 }
      );
    }

    // Validación de campos requeridos (solo los que completa el cliente)
    const requiredFields = ['potenciaContratada', 'fechaInstalacion', 'detalles'];
    const missingFields = requiredFields.filter(field => !body[field]?.toString().trim());
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Faltan campos requeridos: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Preparar los datos para actualizar en Airtable (solo los campos que completa el cliente)
    const updateData = {
      'Potencia contratada': body.potenciaContratada.trim(),
      'Fecha instalación': body.fechaInstalacion.trim(),
      'Detalles': body.detalles.trim(),
    };

    // Actualizar el registro existente
    await updateServicioRecord(body.recordId, updateData);

    // Manejar archivos adjuntos
    const attachmentFields: Array<[string, string]> = [
      ['fotoGeneral', 'Foto general'],
      ['fotoEtiqueta', 'Foto etiqueta'],
      ['fotoCuadroElectrico', 'Foto cuadro'],
      ['fotoRoto', 'Foto roto'],
    ];

    for (const [bodyKey, airtableField] of attachmentFields) {
      const attachments = Array.isArray(body[bodyKey]) ? body[bodyKey] : [];
      if (attachments.length > 0) {
        // Limpiar archivos existentes antes de subir nuevos
        await updateServicioRecord(body.recordId, { [airtableField]: [] });

        // Subir nuevos archivos
        for (const attachment of attachments) {
          await uploadImageToServiciosAirtable(body.recordId, airtableField, attachment);
        }
      }
    }

    return NextResponse.json({ 
      id: body.recordId,
      message: 'Formulario actualizado exitosamente' 
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Reparaciones API error:', error);
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
    const recordId = searchParams.get('recordId');
    const expediente = searchParams.get('expediente');

    if (!recordId && !expediente) {
      return NextResponse.json({ error: 'Se requiere recordId o expediente' }, { status: 400 });
    }

    let record;
    
    if (recordId) {
      // Buscar por record ID directamente en tabla Formularios
      record = await getServicioById(recordId);
      if (!record) {
        return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
      }
    } else {
      // Buscar por expediente en tabla Formularios
      const records = await findServicioByExpediente(expediente!);
      if (records.length === 0) {
        return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
      }
      record = records[0];
    }

    const fields = record.fields || {};

    // Retornamos los campos específicos que necesita el formulario
    // Solo mostrar Cliente, Dirección y Teléfono (no Expediente)
    return NextResponse.json({
      id: record.id,
      cliente: fields['Cliente'] || '',
      telefono: fields['Teléfono'] || '',
      direccion: fields['Dirección'] || '',
      // Campos que completa el cliente
      potenciaContratada: fields['Potencia contratada'] || '',
      fechaInstalacion: fields['Fecha instalación'] || '',
      detalles: fields['Detalles'] || '',
      // Archivos adjuntos
      fotoGeneral: fields['Foto general'] || [],
      fotoEtiqueta: fields['Foto etiqueta'] || [],
      fotoCuadroElectrico: fields['Foto cuadro'] || [],
      fotoRoto: fields['Foto roto'] || [],
    });
  } catch (error: any) {
    console.error('Get reparaciones error:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del formulario' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get('recordId');

  if (!recordId) {
    return NextResponse.json({ error: 'Se requiere recordId' }, { status: 400 });
  }

  try {
    const body = await request.json();

    const fieldsToUpdate: Record<string, any> = {};
    
    // Mapear campos del formulario a campos de Airtable
    const fieldMapping: Array<[string, string]> = [
      ['cliente', 'Cliente'],
      ['telefono', 'Teléfono'],
      ['direccion', 'Dirección'],
      ['potenciaContratada', 'Potencia contratada'],
      ['fechaInstalacion', 'Fecha instalación'],
      ['detalles', 'Detalles'],
    ];

    // Actualizar campos de texto
    fieldMapping.forEach(([bodyKey, airtableField]) => {
      if (bodyKey in body && typeof body[bodyKey] === 'string') {
        fieldsToUpdate[airtableField] = body[bodyKey].trim();
      }
    });

    // Actualizar campos básicos si hay alguno
    if (Object.keys(fieldsToUpdate).length > 0) {
      await updateServicioRecord(recordId, fieldsToUpdate);
    }

    // Manejar archivos adjuntos también en el método PUT
    const attachmentFields: Array<[string, string]> = [
      ['fotoGeneral', 'Foto general'],
      ['fotoEtiqueta', 'Foto etiqueta'],
      ['fotoCuadroElectrico', 'Foto cuadro'],
      ['fotoRoto', 'Foto roto'],
    ];

    for (const [bodyKey, airtableField] of attachmentFields) {
      const attachments = Array.isArray(body[bodyKey]) ? body[bodyKey] : [];
      if (attachments.length > 0) {
        // Limpiar archivos existentes antes de subir nuevos
        await updateServicioRecord(recordId, { [airtableField]: [] });

        // Subir nuevos archivos
        for (const attachment of attachments) {
          await uploadImageToServiciosAirtable(recordId, airtableField, attachment);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      recordId: recordId,
      message: 'Formulario actualizado exitosamente'
    });
    
  } catch (error: any) {
    console.error('Update reparaciones error:', error);
    const message = typeof error?.message === 'string' ? error.message : 'Error al actualizar el formulario';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}