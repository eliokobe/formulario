import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/airtable';

export async function POST(request: NextRequest) {
  console.log('🚀 POST request received at /api/clientes');
  
  try {
    const body = await request.json();
    
    console.log('📥 Data received:');
    console.log(JSON.stringify(body, null, 2));

    // Required fields validation
    const requiredFields = [
      'Nombre de la clínica', 'Email', 'Teléfono', 'Dirección', 
      'Horario de atención', '¿Tienen más de una sede?', 
      '¿Tienen ficha en Google Business?', 'Enlace a su web',
      '¿Qué calendario usan?', '¿Cuántos calendario tienen?', 'Password'
    ];

    console.log('🔍 Checking required fields...');
    for (const field of requiredFields) {
      const value = body[field];
      console.log(`  ${field}: ${value ? 'Present' : 'MISSING'}`);
      if (!value) {
        console.log(`❌ Missing required field: ${field}`);
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const payload = {
      fields: {
        'Name': body['Nombre de la clínica'],
        'Email': body['Email'],
        'Phone': body['Teléfono'],
        'Dirección': body['Dirección'],
        'Horario de atención': body['Horario de atención'],
        '¿Tienen más de una sede?': body['¿Tienen más de una sede?'],
        '¿Tienen ficha en Google Business?': body['¿Tienen ficha en Google Business?'],
        'Enlace a ficha de Google Business': body['Enlace a ficha de Google Business'] || '',
        'Enlace a su web': body['Enlace a su web'],
        '¿Qué calendario usan?': body['¿Qué calendario usan?'],
        '¿Cuántos calendario tienen?': body['¿Cuántos calendario tienen?'],
        'Password': body['Password'],
        'Logo': body['Logo'] || [],
        'Catálogo': body['Catálogo'] || [],
      }
    };

    console.log('📤 Payload to Airtable:');
    console.log(JSON.stringify(payload, null, 2));

    // Create the client record
    const result = await createClient(payload.fields);

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Complete error:', error);
    return NextResponse.json({ 
      error: 'Failed to create record in Clientes',
      details: error.message 
    }, { status: 500 });
  }
}