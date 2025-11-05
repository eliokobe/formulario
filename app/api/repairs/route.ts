import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { 
  createRepair, 
  findRepairByExpediente,
  getRepairById, 
  updateRepairRecord, 
  uploadImageToAirtable 
} from '@/lib/airtable';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    console.log('🔧 Environment check:');
    console.log('AIRTABLE_TOKEN:', process.env.AIRTABLE_TOKEN ? 'Set' : 'Missing');
    
    const body = await request.json();
    console.log('📥 Request body:', JSON.stringify(body, null, 2));
    
    const resultado = typeof body.Resultado === 'string' ? body.Resultado.trim() : '';
    const reparacion = typeof body.Reparación === 'string' ? body.Reparación.trim() : '';
    const cuadroElectrico = typeof body['Cuadro eléctrico'] === 'string' ? body['Cuadro eléctrico'].trim() : '';
    const problema = typeof body.Problema === 'string' ? body.Problema.trim() : '';

    // Validation - only require essential fields
    if (!resultado) {
      return NextResponse.json(
        { error: 'El campo Resultado es obligatorio' },
        { status: 400 }
      );
    }

    if (!['Reparado', 'No reparado'].includes(resultado)) {
      return NextResponse.json(
        { error: 'Valor de Resultado no válido' },
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

    if (resultado === 'Reparado' && reparacion === 'Reparar el cuadro eléctrico' && !cuadroElectrico) {
      return NextResponse.json(
        { error: 'Selecciona qué se reparó en el cuadro eléctrico' },
        { status: 400 }
      );
    }

    if (resultado === 'No reparado' && !problema) {
      return NextResponse.json(
        { error: 'Describe el problema encontrado' },
        { status: 400 }
      );
    }

    body.Resultado = resultado;
    // Only set select fields if they have values, otherwise don't include them
    body.Reparación = reparacion || undefined;
    body['Cuadro eléctrico'] = cuadroElectrico || undefined;
    body.Problema = problema;

    // Create the repair record
    const result = await createRepair(body);

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
    const recordId = searchParams.get('record');
    const expediente = searchParams.get('expediente');

    if (!recordId && !expediente) {
      return NextResponse.json({ error: 'Se requiere record o expediente' }, { status: 400 });
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
      cliente: fields['Cliente'] || '',
      direccion: fields['Dirección'] || '',
      resultado: fields['Resultado'] || '',
      reparacion: fields['Reparación'] || '',
      cuadroElectrico: fields['Cuadro eléctrico'] || '',
      problema: fields['Problema'] || '',
      factura: fields['Factura'] || [],
      foto: fields['Foto'] || [],
      fotoEtiqueta: fields['Foto de la etiqueta'] || [],
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
  const recordId = searchParams.get('record');
  const expediente = searchParams.get('expediente');

  if (!recordId && !expediente) {
    return NextResponse.json({ error: 'Se requiere record o expediente' }, { status: 400 });
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
    const selectFields = ['Reparación', 'Cuadro eléctrico'];
    
    const textFields: Array<[string, string]> = [
      ['Resultado', 'Resultado'],
      ['Reparación', 'Reparación'],
      ['Cuadro eléctrico', 'Cuadro eléctrico'],
      ['Problema', 'Problema'],
      ['Técnico', 'Técnico'],
      ['Cliente', 'Cliente'],
      ['Dirección', 'Dirección'],
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

    if (Object.keys(fieldsToUpdate).length > 0) {
      await updateRepairRecord(targetRecordId, fieldsToUpdate);
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
