import { NextRequest, NextResponse } from 'next/server';
import { getCitasOcupadasByDate } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get('fecha'); // Formato: YYYY-MM-DD

  if (!fecha) {
    return NextResponse.json(
      { error: 'Se requiere el parámetro fecha' },
      { status: 400 }
    );
  }

  try {
    const fechaDate = new Date(fecha);
    
    if (isNaN(fechaDate.getTime())) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const citas = await getCitasOcupadasByDate(fechaDate);
    
    // Extraer las horas ocupadas
    const horasOcupadas = citas
      .filter(cita => cita.cita)
      .map(cita => {
        const citaDate = new Date(cita.cita);
        const horas = citaDate.getHours().toString().padStart(2, '0');
        const minutos = citaDate.getMinutes().toString().padStart(2, '0');
        return `${horas}:${minutos}`;
      });

    return NextResponse.json({ 
      fecha,
      horasOcupadas,
      totalCitas: citas.length 
    });
  } catch (error: any) {
    console.error('Error al consultar disponibilidad:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
