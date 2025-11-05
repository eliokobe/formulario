import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'API connection is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error: any) {
    console.error('Test connection error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Connection test failed'
    }, { status: 500 });
  }
}