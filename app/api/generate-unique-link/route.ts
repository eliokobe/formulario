import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { expediente } = await request.json();

    if (!expediente) {
      return NextResponse.json({ error: 'Expediente requerido' }, { status: 400 });
    }

    // Generar URL única para el expediente
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const uniqueUrl = `${baseUrl}/?expediente=${encodeURIComponent(expediente)}`;

    return NextResponse.json({ 
      success: true, 
      url: uniqueUrl,
      expediente: expediente
    });
  } catch (error) {
    console.error('Error generando enlace:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const expediente = searchParams.get('expediente');

  if (!expediente) {
    return NextResponse.json({ error: 'Expediente requerido' }, { status: 400 });
  }

  try {
    // Generar URL única para el expediente
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const uniqueUrl = `${baseUrl}/?expediente=${encodeURIComponent(expediente)}`;

    return NextResponse.json({ 
      success: true, 
      url: uniqueUrl,
      expediente: expediente
    });
  } catch (error) {
    console.error('Error generando enlace:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
