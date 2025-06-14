import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing forgot password request');

    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Try backend first
    try {
      console.log('🔄 Attempting backend forgot password:', `${BACKEND_URL}/api/auth/forgot-password`);

      const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': request.headers.get('origin') || 'http://localhost:3001',
          'User-Agent': request.headers.get('user-agent') || 'NextJS-Proxy',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const responseText = await response.text();
        const data = responseText ? JSON.parse(responseText) : {};
        console.log('✅ Backend forgot password successful');
        return NextResponse.json(data, { status: response.status });
      } else {
        // Handle backend errors
        const errorText = await response.text();
        console.error('❌ Backend forgot password failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        let errorData;
        try {
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch {
          errorData = { success: false, message: 'Failed to process password reset request' };
        }

        return NextResponse.json(errorData, { status: response.status });
      }
    } catch (backendError) {
      console.warn('⚠️ Backend unavailable for forgot password, using mock response');
      
      // Mock response for development
      const mockResponse = {
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.',
        data: {}
      };

      // Log mock email for development
      console.log('\n📧 ===== MOCK PASSWORD RESET EMAIL =====');
      console.log(`To: ${email}`);
      console.log(`Subject: Password Reset Request - Course Management System`);
      console.log(`Reset Link: http://localhost:3000/auth/reset-password?token=mock-token-${Date.now()}`);
      console.log('📧 ====================================\n');

      return NextResponse.json(mockResponse, { status: 200 });
    }

  } catch (error) {
    console.error('❌ Forgot password error:', error);
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
