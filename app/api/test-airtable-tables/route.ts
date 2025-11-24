import { NextRequest, NextResponse } from 'next/server';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export async function GET(request: NextRequest) {
  try {
    // Intentar hacer una solicitud a la tabla Servicios para ver si existe
    const serviciosUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Servicios?maxRecords=1`;
    
    console.log('🔍 Testing Servicios table URL:', serviciosUrl);
    
    const response = await fetch(serviciosUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    console.log('📥 Response status:', response.status);
    console.log('📥 Response body:', responseText);

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Tabla Servicios existe y es accesible',
        status: response.status,
        data: JSON.parse(responseText)
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Error al acceder a la tabla Servicios',
        status: response.status,
        error: responseText
      });
    }
  } catch (error: any) {
    console.error('❌ Error testing table:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}