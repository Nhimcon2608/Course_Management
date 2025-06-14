import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    // Get search params
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Try backend first
    try {
      // Build query params
      const params = new URLSearchParams({
        limit,
        offset
      });

      if (status) params.append('status', status);
      if (search) params.append('search', search);

      // Call backend API using request headers
      const backendUrl = `${BACKEND_URL}/api/instructor/courses?${params.toString()}`;

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

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      } else {
        console.error('Backend response error:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Backend error details:', errorData);

        return NextResponse.json(
          {
            success: false,
            message: `Backend error: ${response.status} ${response.statusText}`,
            error: errorData
          },
          { status: response.status }
        );
      }
    } catch (backendError) {
      console.error('❌ Backend connection failed for instructor courses:', (backendError as Error).message);

      return NextResponse.json(
        {
          success: false,
          message: 'Unable to connect to backend server. Please ensure the backend is running.',
          error: (backendError as Error).message
        },
        { status: 503 }
      );
    }



  } catch (error) {
    console.error('Get instructor courses error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve instructor courses',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();

    // Call backend API using request headers
    const backendUrl = `${BACKEND_URL}/api/instructor/courses`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': request.headers.get('origin') || 'http://localhost:3000',
        'Cookie': request.headers.get('cookie') || '',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend API error:', response.status, errorData);

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to create course in backend',
          error: `Backend returned ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create course',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
