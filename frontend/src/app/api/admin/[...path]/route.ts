import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const backendUrl = `${BACKEND_URL}/admin${path ? `/${path}` : ''}${searchParams ? `?${searchParams}` : ''}`;

    console.log(`🔄 Admin API GET: ${backendUrl}`);

    // Get authorization header from request
    const authHeader = request.headers.get('authorization');
    console.log('🔑 Admin API Authorization header:', authHeader ? 'Present' : 'Missing');

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
      method: 'GET',
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ Admin API Error: ${response.status}`, data);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin API GET Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const body = await request.json();
    const backendUrl = `${BACKEND_URL}/admin${path ? `/${path}` : ''}`;

    console.log(`🔄 Admin API POST: ${backendUrl}`);

    // Get authorization header from request
    const authHeader = request.headers.get('authorization');

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
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ Admin API Error: ${response.status}`, data);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin API POST Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const body = await request.json();
    const backendUrl = `${BACKEND_URL}/admin${path ? `/${path}` : ''}`;

    console.log(`🔄 Admin API PUT: ${backendUrl}`);

    // Get authorization header from request
    const authHeader = request.headers.get('authorization');

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

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ Admin API Error: ${response.status}`, data);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin API PUT Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const backendUrl = `${BACKEND_URL}/admin${path ? `/${path}` : ''}`;

    console.log(`🔄 Admin API DELETE: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ Admin API Error: ${response.status}`, data);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin API DELETE Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
