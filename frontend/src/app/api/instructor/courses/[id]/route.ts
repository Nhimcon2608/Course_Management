import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;

    // Call backend API using request headers
    const backendUrl = `${BACKEND_URL}/api/instructor/courses/${courseId}`;

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
    console.error('❌ Backend connection failed for instructor course:', (backendError as Error).message);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to connect to backend server. Please ensure the backend is running.',
        error: (backendError as Error).message
      },
      { status: 503 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;
    const body = await request.json();

    // Call backend API using request headers
    const backendUrl = `${BACKEND_URL}/api/instructor/courses/${courseId}`;

    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Origin': request.headers.get('origin') || 'http://localhost:3000',
        'Cookie': request.headers.get('cookie') || '',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body),
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
    console.error('❌ Backend connection failed for instructor course update:', (backendError as Error).message);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to connect to backend server. Please ensure the backend is running.',
        error: (backendError as Error).message
      },
      { status: 503 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;

    // Call backend API using request headers
    const backendUrl = `${BACKEND_URL}/api/instructor/courses/${courseId}`;

    const response = await fetch(backendUrl, {
      method: 'DELETE',
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
    console.error('❌ Backend connection failed for instructor course delete:', (backendError as Error).message);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to connect to backend server. Please ensure the backend is running.',
        error: (backendError as Error).message
      },
      { status: 503 }
    );
  }
}
