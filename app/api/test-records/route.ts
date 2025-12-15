import { NextRequest, NextResponse } from 'next/server';
import { listRecords } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  try {
    const tableName = process.env.AIRTABLE_TABLE_NAME;
    
    if (!tableName) {
      return NextResponse.json({
        success: false,
        error: 'Table name not configured'
      }, { status: 400 });
    }
    
    // Get a few test records
    const records = await listRecords(tableName, { limit: '3' });
    
    return NextResponse.json({
      success: true,
      message: 'Records retrieved successfully',
      recordCount: records.length,
      sampleRecords: records.map(record => ({
        id: record.id,
        fields: Object.keys(record.fields || {})
      }))
    });
  } catch (error: any) {
    console.error('Test records error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to retrieve test records'
    }, { status: 500 });
  }
}