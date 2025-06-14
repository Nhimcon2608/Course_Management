import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:5000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 Processing course GET request for ID:', params.id);
    
    const backendUrl = `${BACKEND_URL}/courses/${params.id}`;

    console.log('📡 Forwarding to backend:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
        'Authorization': request.headers.get('authorization') || '',
      },
    });

    console.log('📡 Backend response status:', response.status);

    const data = await response.json();
    console.log('📡 Backend response data:', data);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Course GET API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 Processing course PUT request for ID:', params.id);
    
    const body = await request.json();
    const backendUrl = `${BACKEND_URL}/courses/${params.id}`;

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
    console.error('Course PUT API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 Processing course DELETE request for ID:', params.id);
    
    const backendUrl = `${BACKEND_URL}/courses/${params.id}`;

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
    console.error('Course DELETE API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
