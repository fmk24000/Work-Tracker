import { NextResponse } from 'next/server';
import { readTrackerData, writeTrackerData } from '@/lib/tracker/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await readTrackerData();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read tracker data', detail: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const data = await writeTrackerData(body);
    return NextResponse.json({ data, meta: { saved: true } });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save tracker data', detail: error.message },
      { status: 500 }
    );
  }
}
