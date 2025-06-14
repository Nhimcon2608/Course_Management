import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing reset password request');

    const body = await request.json();
    const { token, password } = body;

    // Validate required fields
    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Reset token and new password are required' },
        { status: 400 }
      );
    }

    // Try backend first
    try {
      console.log('🔄 Attempting backend reset password:', `${BACKEND_URL}/api/auth/reset-password`);

      const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
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
        console.log('✅ Backend reset password successful');
        return NextResponse.json(data, { status: response.status });
      } else {
        // Handle backend errors
        const errorText = await response.text();
        console.error('❌ Backend reset password failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        let errorData;
        try {
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch {
          errorData = { success: false, message: 'Failed to reset password' };
        }

        return NextResponse.json(errorData, { status: response.status });
      }
    } catch (backendError) {
      console.warn('⚠️ Backend unavailable for reset password, using mock response');
      
      // Mock response for development
      if (token.startsWith('mock-token-')) {
        const mockResponse = {
          success: true,
          message: 'Password has been reset successfully. You can now log in with your new password.',
          data: {}
        };

        // Log mock password reset for development
        console.log('\n🔐 ===== MOCK PASSWORD RESET =====');
        console.log(`Token: ${token}`);
        console.log(`New Password: ${password.replace(/./g, '*')}`);
        console.log('Password reset successful (mock)');
        console.log('🔐 ==============================\n');

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
    console.error('❌ Reset password error:', error);
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
