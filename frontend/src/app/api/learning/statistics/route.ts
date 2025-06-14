import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    // Call backend API using request headers (same as auth/profile)
    const backendUrl = `${BACKEND_URL}/api/learning/statistics`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': request.headers.get('origin') || 'http://localhost:3000',
        'Cookie': request.headers.get('cookie') || '',
        'Authorization': request.headers.get('authorization') || '',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend API error:', response.status, errorData);

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to fetch learning statistics from backend',
          error: `Backend returned ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the data from backend
    return NextResponse.json(data);

  } catch (error) {
    console.error('Get learning statistics error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve learning statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
