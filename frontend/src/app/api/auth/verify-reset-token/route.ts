import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Processing verify reset token request');

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Validate token
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Reset token is required' },
        { status: 400 }
      );
    }

    // Try backend first
    try {
      console.log('🔄 Attempting backend verify reset token:', `${BACKEND_URL}/api/auth/verify-reset-token`);

      const response = await fetch(`${BACKEND_URL}/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': request.headers.get('origin') || 'http://localhost:3001',
          'User-Agent': request.headers.get('user-agent') || 'NextJS-Proxy',
        },
      });

      if (response.ok) {
        const responseText = await response.text();
        const data = responseText ? JSON.parse(responseText) : {};
        console.log('✅ Backend verify reset token successful');
        return NextResponse.json(data, { status: response.status });
      } else {
        // Handle backend errors
        const errorText = await response.text();
        console.error('❌ Backend verify reset token failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        let errorData;
        try {
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch {
          errorData = { success: false, message: 'Invalid or expired reset token' };
        }

        return NextResponse.json(errorData, { status: response.status });
      }
    } catch (backendError) {
      console.warn('⚠️ Backend unavailable for verify reset token, using mock response');
      
      // Mock response for development
      if (token.startsWith('mock-token-')) {
        const mockResponse = {
          success: true,
          message: 'Reset token is valid',
          data: {
            email: 'user@example.com',
            tokenValid: true
          }
        };
        return NextResponse.json(mockResponse, { status: 200 });
      } else {
        const mockErrorResponse = {
          success: false,
          message: 'Invalid or expired reset token'
        };
        return NextResponse.json(mockErrorResponse, { status: 400 });
      }
    }

  } catch (error) {
    console.error('❌ Verify reset token error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
