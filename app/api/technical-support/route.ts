import { NextRequest, NextResponse } from 'next/server';
import { createFormulario } from '@/lib/airtable';

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
