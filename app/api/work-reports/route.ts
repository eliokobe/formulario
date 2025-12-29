import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { updateRecord } from '@/lib/airtable';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    console.log('🔧 Environment check:');
    console.log('AIRTABLE_TOKEN:', process.env.AIRTABLE_TOKEN ? 'Set' : 'Missing');
    
    const body = await request.json();
    console.log('📥 Work Report Request body:', JSON.stringify(body, null, 2));
    
    const { 
      repairId, 
      problemaSolucionado, 
      accionRealizada, 
      problemaDescripcion,
      detallesTrabajo,
      numeroSerie,
      fotoReparacion,
      facturaServicio 
    } = body;

    // Validation
    if (!problemaSolucionado || !accionRealizada || !problemaDescripcion || !detallesTrabajo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: problemaSolucionado, accionRealizada, problemaDescripcion y detallesTrabajo son obligatorios' },
        { status: 400 }
      );
    }

    // Validate serial number if replacing charging point
    if (accionRealizada === 'Sustituir el punto de recarga' && !numeroSerie) {
      return NextResponse.json(
        { error: 'El número de serie es requerido al sustituir el punto de recarga' },
        { status: 400 }
      );
    }

    // Prepare data to update in Airtable
    const updateData: any = {
      Estado: problemaSolucionado,
      Reparación: accionRealizada,
      Problema: problemaDescripcion,
      Detalles: detallesTrabajo,
      "Fecha pago": problemaSolucionado === 'Reparado' ? new Date().toISOString().split('T')[0] : undefined,
      Pagado: problemaSolucionado === 'Reparado',
    };

    // Add serial number only if provided
    if (numeroSerie) {
      updateData["Número de serie"] = numeroSerie;
    }

    // If we have a repairId, update existing record
    if (repairId) {
      const result = await updateRecord('Reparaciones', repairId, updateData);
      return NextResponse.json({ id: result.id, updated: true }, { status: 200 });
    } else {
      // Create new work report record (this would be a different table or approach)
      // For now, we'll create a new repair record
      const { createRecord } = await import('@/lib/airtable');
      const result = await createRecord('Reparaciones', {
        ...updateData,
        "Fecha creacion": new Date().toISOString(),
        Formulario: 'Parte de Trabajo',
      });
      return NextResponse.json({ id: result.id, created: true }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Work Report API error:', error);
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
    const repairId = searchParams.get('repairId');
    
    if (!repairId) {
      return NextResponse.json(
        { error: 'repairId es requerido' },
        { status: 400 }
      );
    }

    // Get repair details for the work report
    // This would fetch the repair data from Airtable
    // For now, return mock data
    const repairData = {
      id: repairId,
      cliente: 'Juan Pérez García',
      direccion: 'Calle Mayor 123, 28001 Madrid',
      tecnico: 'María García López',
      servicios: ['Reparación de punto de recarga'],
      fechaVisita: '2025-10-10T10:00:00Z'
    };

    return NextResponse.json(repairData);
  } catch (error: any) {
    console.error('Get work report error:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de la reparación' },
      { status: 500 }
    );
  }
}
