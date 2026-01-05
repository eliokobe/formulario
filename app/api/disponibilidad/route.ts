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
    // Airtable devuelve las fechas en UTC, pero la columna está configurada con timezone Europe/Madrid
    // Necesitamos convertir de UTC a Europe/Madrid
    const horasOcupadas = citas
      .filter(cita => cita.cita)
      .map(cita => {
        const citaDate = new Date(cita.cita);
        
        // Convertir a Europe/Madrid timezone y extraer solo la hora
        const formatter = new Intl.DateTimeFormat('es-ES', {
          timeZone: 'Europe/Madrid',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        const parts = formatter.formatToParts(citaDate);
        const hora = parts.find(p => p.type === 'hour')?.value || '00';
        const minuto = parts.find(p => p.type === 'minute')?.value || '00';
        
        return `${hora}:${minuto}`;
      });

    return NextResponse.json({ 
      fecha,
      horasOcupadas,
      totalCitas: citas.length,
      debug: citas.map(c => ({ raw: c.cita, converted: horasOcupadas[citas.indexOf(c)] }))
    });
  } catch (error: any) {
    console.error('Error al consultar disponibilidad:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
