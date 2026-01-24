import { NextRequest, NextResponse } from 'next/server';
import { listBloqueos, createBloqueo, deleteBloqueo } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const password = request.headers.get('x-admin-password');
  const expected = process.env.ADMIN_PASSWORD || 'fomveB-0wuzme-revbox';
  return password === expected;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const records = await listBloqueos({
      'sort[0][field]': 'Inicio',
      'sort[0][direction]': 'desc',
    });

    const bloqueos = records.map(record => ({
      id: record.id,
      inicio: record.fields?.['Inicio'],
      fin: record.fields?.['Fin'],
      motivo: record.fields?.['Motivo'] || '',
    }));

    return NextResponse.json({ bloqueos });
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const inicioRaw = typeof body?.inicio === 'string' ? body.inicio.trim() : '';
    const finRaw = typeof body?.fin === 'string' ? body.fin.trim() : '';
    const motivo = typeof body?.motivo === 'string' ? body.motivo.trim() : '';

    if (!inicioRaw || !finRaw) {
      return NextResponse.json({ error: 'Inicio y fin son obligatorios' }, { status: 400 });
    }

    const inicioDate = new Date(inicioRaw);
    const finDate = new Date(finRaw);

    if (isNaN(inicioDate.getTime()) || isNaN(finDate.getTime())) {
      return NextResponse.json({ error: 'Formato de fecha inválido' }, { status: 400 });
    }

    if (finDate <= inicioDate) {
      return NextResponse.json({ error: 'El fin debe ser posterior al inicio' }, { status: 400 });
    }

    const result = await createBloqueo({
      inicio: inicioDate.toISOString(),
      fin: finDate.toISOString(),
      motivo: motivo || undefined,
    });

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Se requiere id' }, { status: 400 });
    }

    const result = await deleteBloqueo(id);
    return NextResponse.json({ id: result.id });
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
