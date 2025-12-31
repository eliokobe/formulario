import { NextRequest, NextResponse } from 'next/server';
import { createFormulario, getFormularioById, updateServicioRecord } from '@/lib/airtable';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 Received body keys:', Object.keys(body));
    console.log('📅 Cita value:', body.Cita);
    
    // Validar campos requeridos
    if (!body.Cliente || !body.Teléfono || !body.Dirección) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: Cliente, Teléfono y Dirección son obligatorios' },
        { status: 400 }
      );
    }

    // Crear el registro en la tabla Formularios
    const formularioData: Record<string, any> = {
      "Cliente": body.Cliente,
      "Teléfono": body.Teléfono,
      "Dirección": body.Dirección,
      "Potencia contratada en kW": body["Potencia contratada en kW"],
      "Fecha instalación": body["Fecha instalación"],
      "Foto general": body["Foto general"],
      "Foto etiqueta": body["Foto etiqueta"],
      "Foto cuadro": body["Foto cuadro"],
      "Foto roto": body["Foto roto"],
      "Detalles": body.Detalles,
    };
    
    // Solo agregar Cita si existe y no es null
    if (body.Cita) {
      formularioData["Cita"] = body.Cita;
      console.log('✅ Cita incluida en formularioData:', body.Cita);
    } else {
      console.log('⚠️ Cita no proporcionada o es null');
    }

    console.log('📝 formularioData keys:', Object.keys(formularioData));

    const result = await createFormulario(formularioData);

    // Si el formulario está vinculado a un Servicio(s), sincronizar Estado y Cita en la tabla Servicios
    try {
      const createdRecord = await getFormularioById(result.id);
      const servicioLinkPlural = createdRecord?.fields?.['Servicios'];
      const servicioLinkSingular = createdRecord?.fields?.['Servicio'];

      // Los enlaces suelen venir como array de record IDs; priorizar campo plural
      const servicioId = Array.isArray(servicioLinkPlural) && servicioLinkPlural.length > 0
        ? servicioLinkPlural[0]
        : Array.isArray(servicioLinkSingular) && servicioLinkSingular.length > 0
          ? servicioLinkSingular[0]
          : undefined;

      if (servicioId) {
        const fieldsToSync: Record<string, any> = { Estado: 'Citado' };
        if (body.Cita) {
          fieldsToSync.Cita = body.Cita;
        }

        await updateServicioRecord(servicioId, fieldsToSync);
        console.log(`✅ Sincronización en Servicios (${servicioId}) completada`, Object.keys(fieldsToSync));
      } else {
        console.log('ℹ️ No se encontró un Servicio(s) vinculado para sincronizar la Cita/Estado');
      }
    } catch (syncError: any) {
      console.error('❌ Error al sincronizar datos en Servicios:', syncError);
      return NextResponse.json(
        { error: 'Solicitud creada, pero no se pudo actualizar Servicios', details: syncError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      id: result.id,
      message: 'Solicitud de diagnóstico creada exitosamente' 
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Technical support API error:', error);
    const message = typeof error?.message === 'string' ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
