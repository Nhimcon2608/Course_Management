import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:5000/api';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const backendUrl = `${BACKEND_URL}/courses${searchParams ? `?${searchParams}` : ''}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Courses GET API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing course creation request');

    const body = await request.json();
    const backendUrl = `${BACKEND_URL}/courses`;

    console.log('📡 Forwarding to backend:', backendUrl);
    console.log('📝 Request body:', body);

    // Get authorization header from request
    const authHeader = request.headers.get('authorization');
    console.log('🔑 Authorization header:', authHeader ? 'Present' : 'Missing');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Add cookies for additional auth support
    const cookies = request.headers.get('cookie');
    if (cookies) {
      headers['Cookie'] = cookies;
    }

    console.log('📡 Request headers:', headers);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    console.log('📡 Backend response status:', response.status);

    const data = await response.json();
    console.log('📡 Backend response data:', data);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Courses POST API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 Processing course update request');

    const body = await request.json();
    const url = new URL(request.url);
    const courseId = url.searchParams.get('id');

    if (!courseId) {
      return NextResponse.json(
        { success: false, message: 'Course ID is required' },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_URL}/courses/${courseId}`;

    console.log('📡 Forwarding to backend:', backendUrl);
    console.log('📝 Request body:', body);

    // Get authorization header from request
    const authHeader = request.headers.get('authorization');
    console.log('🔑 PUT Authorization header:', authHeader ? 'Present' : 'Missing');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Add cookies for additional auth support
    const cookies = request.headers.get('cookie');
    if (cookies) {
      headers['Cookie'] = cookies;
    }

    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    console.log('📡 Backend response status:', response.status);

    const data = await response.json();
    console.log('📡 Backend response data:', data);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Courses PUT API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🔄 Processing course deletion request');

    const url = new URL(request.url);
    const courseId = url.searchParams.get('id');

    if (!courseId) {
      return NextResponse.json(
        { success: false, message: 'Course ID is required' },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_URL}/courses/${courseId}`;

    console.log('📡 Forwarding to backend:', backendUrl);

    // Get authorization header from request
    const authHeader = request.headers.get('authorization');
    console.log('🔑 DELETE Authorization header:', authHeader ? 'Present' : 'Missing');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Add cookies for additional auth support
    const cookies = request.headers.get('cookie');
    if (cookies) {
      headers['Cookie'] = cookies;
    }

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers,
    });

    console.log('📡 Backend response status:', response.status);

    const data = await response.json();
    console.log('📡 Backend response data:', data);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Courses DELETE API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
