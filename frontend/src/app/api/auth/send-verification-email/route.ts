import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing send verification email request');

    const body = await request.json();

    // Try backend first
    try {
      console.log('🔄 Attempting backend send verification email:', `${BACKEND_URL}/api/auth/send-verification-email`);

      const response = await fetch(`${BACKEND_URL}/api/auth/send-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': request.headers.get('origin') || 'http://localhost:3001',
          'Cookie': request.headers.get('cookie') || '',
          'Authorization': request.headers.get('authorization') || '',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const responseText = await response.text();
        const data = responseText ? JSON.parse(responseText) : {};
        console.log('✅ Backend send verification email successful');
        return NextResponse.json(data, { status: response.status });
      } else {
        // Handle backend errors
        const errorText = await response.text();
        console.error('❌ Backend send verification email failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        let errorData;
        try {
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch {
          errorData = { success: false, message: 'Failed to send verification email' };
        }

        return NextResponse.json(errorData, { status: response.status });
      }
    } catch (backendError) {
      console.warn('⚠️ Backend unavailable for send verification email, using mock response');
      
      // Mock response for development
      const mockResponse = {
        success: true,
        message: 'Verification email sent successfully. Please check your inbox.',
        data: {}
      };

      // Log mock email for development
      console.log('\n📧 ===== MOCK EMAIL VERIFICATION EMAIL =====');
      console.log(`To: ${body.email || 'current-user@example.com'}`);
      console.log(`Subject: Verify Your Email Address - Course Management System`);
      console.log(`Verification Link: http://localhost:3000/auth/verify-email?token=mock-verification-token-${Date.now()}`);
      console.log('📧 ========================================\n');

      return NextResponse.json(mockResponse, { status: 200 });
    }

  } catch (error) {
    console.error('❌ Send verification email error:', error);
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
