import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test Airtable connection
    const token = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME;
    
    if (!token || !baseId || !tableName) {
      return NextResponse.json({
        success: false,
        error: 'Missing Airtable configuration',
        config: {
          token: !!token,
          baseId: !!baseId,
          tableName: !!tableName
        }
      }, { status: 400 });
    }
    
    // Test API call
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=1`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Airtable API error: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Airtable connection successful',
      recordCount: data.records?.length || 0
    });
  } catch (error: any) {
    console.error('Test Airtable error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
}