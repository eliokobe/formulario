import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || '';
    const email = searchParams.get('email') || '';
    const date = searchParams.get('date') || '';
    const time = searchParams.get('time') || '';
    
    // Generate URL with parameters
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://formulario.ritest.es';
    const params = new URLSearchParams();
    
    if (name) params.set('name', name);
    if (email) params.set('email', email);
    if (date) params.set('date', date);
    if (time) params.set('time', time);
    params.set('preload', 'true');
    
    const generatedUrl = `${baseUrl}?${params.toString()}`;
    
    return NextResponse.json({ 
      url: generatedUrl,
      parameters: { name, email, date, time }
    });
  } catch (error: any) {
    console.error('Generate URL error:', error);
    return NextResponse.json(
      { error: 'Error generating URL' },
      { status: 500 }
    );
  }
}