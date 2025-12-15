import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_SERVICIOS_BASE_ID = 'appcRKAwnzR4sdGPL';
  const AIRTABLE_TABLE_REPARACIONES_SERVICIOS = 'Formularios';
  const recordId = 'recUCIlirIUQEcOWG';

  const url = `https://api.airtable.com/v0/${AIRTABLE_SERVICIOS_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_REPARACIONES_SERVICIOS)}/${recordId}`;
  
  console.log('🔍 Testing URL:', url);
  console.log('🔑 Token present:', !!AIRTABLE_TOKEN);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      }
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Record found:', data);
      return NextResponse.json({ success: true, data });
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return NextResponse.json({ 
        success: false, 
        error: errorText, 
        status: response.status,
        url: url 
      });
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}