import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { findByDateTime, createBooking } from '@/lib/airtable';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    console.log('🔧 Environment check:');
    console.log('AIRTABLE_TOKEN:', process.env.AIRTABLE_TOKEN ? 'Set' : 'Missing');
    console.log('AIRTABLE_BASE_ID:', process.env.AIRTABLE_BASE_ID ? 'Set' : 'Missing');
    console.log('AIRTABLE_TABLE_NAME:', process.env.AIRTABLE_TABLE_NAME ? 'Set' : 'Missing');
    
    const body = await request.json();
    console.log('📥 Request body:', JSON.stringify(body, null, 2));
    
    const { name, email, date_time } = body;

    // Validation
    if (!name || !email || !date_time) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, date_time' },
        { status: 400 }
      );
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof date_time !== 'string') {
      return NextResponse.json(
        { error: 'Invalid field types' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // TODO: Re-enable availability check when needed
    // Check if the time slot is already booked
    // const existingBooking = await findByDateTime(date_time);
    // if (existingBooking) {
    //   return NextResponse.json(
    //     { error: 'Time slot is already booked' },
    //     { status: 409 }
    //   );
    // }

    // Create the booking
    const result = await createBooking({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      date_time,
    });

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error: any) {
    console.error('Booking API error:', error);
    const message = typeof error?.message === 'string' ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}