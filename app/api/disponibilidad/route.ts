import { NextRequest, NextResponse } from 'next/server';
import { getCitasOcupadasByDate, getBloqueosByDate } from '@/lib/airtable';

const TIMEZONE = 'Europe/Madrid';
const SLOT_INTERVAL_MINUTES = 30;

const dateFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('es-ES', {
  timeZone: TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function getDateInTimeZone(date: Date): string {
  return dateFormatter.format(date);
}

function getTimeInTimeZone(date: Date): string {
  const parts = timeFormatter.formatToParts(date);
  const hour = parts.find(p => p.type === 'hour')?.value || '00';
  const minute = parts.find(p => p.type === 'minute')?.value || '00';
  return `${hour}:${minute}`;
}

function roundDownToInterval(date: Date, minutes: number): Date {
  const ms = minutes * 60 * 1000;
  return new Date(Math.floor(date.getTime() / ms) * ms);
}

function roundUpToInterval(date: Date, minutes: number): Date {
  const ms = minutes * 60 * 1000;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

function expandBloqueosToSlots(fecha: string, bloqueos: Array<{ inicio: string; fin: string }>): string[] {
  const slots = new Set<string>();

  bloqueos.forEach(bloqueo => {
    const inicioDate = new Date(bloqueo.inicio);
    const finDate = new Date(bloqueo.fin);

    if (isNaN(inicioDate.getTime()) || isNaN(finDate.getTime())) {
      return;
    }

    let current = roundDownToInterval(inicioDate, SLOT_INTERVAL_MINUTES);
    const end = roundUpToInterval(finDate, SLOT_INTERVAL_MINUTES);

    while (current < end) {
      const dateInTz = getDateInTimeZone(current);
      if (dateInTz === fecha) {
        slots.add(getTimeInTimeZone(current));
      }
      current = new Date(current.getTime() + SLOT_INTERVAL_MINUTES * 60 * 1000);
    }
  });

  return Array.from(slots);
}

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
    const bloqueos = await getBloqueosByDate(fechaDate);
    
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

    const horasBloqueadas = expandBloqueosToSlots(fecha, bloqueos);
    const horasOcupadasTotal = Array.from(new Set([...horasOcupadas, ...horasBloqueadas]));

    return NextResponse.json({ 
      fecha,
      horasOcupadas: horasOcupadasTotal,
      totalCitas: citas.length,
      totalBloqueos: bloqueos.length,
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
