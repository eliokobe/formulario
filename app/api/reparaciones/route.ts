import { NextRequest, NextResponse } from 'next/server';
import { createRepair, listRecords } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Environment check:');
    console.log('AIRTABLE_TOKEN:', process.env.AIRTABLE_TOKEN ? 'Set' : 'Missing');
    
    const body = await request.json();
    console.log('📥 Request body:', JSON.stringify(body, null, 2));
    
    // Validation
    if (!body.descripcion) {
      return NextResponse.json(
        { error: 'La descripción es requerida' },
        { status: 400 }
      );
    }

    // Create the repair record
    const result = await createRepair(body);

    return NextResponse.json({ id: result.id }, { status: 201 });
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
    const limit = searchParams.get('limit') || '10';
    
    const records = await listRecords(process.env.AIRTABLE_TABLE_NAME!, { limit });
    
    return NextResponse.json({ records });
  } catch (error: any) {
    console.error('Get reparaciones error:', error);
    return NextResponse.json(
      { error: 'Error al obtener reparaciones' },
      { status: 500 }
    );
  }
}