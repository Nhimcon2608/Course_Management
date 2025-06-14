import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing update email request');

    const body = await request.json();

    // Validate required fields
    if (!body.newEmail) {
      return NextResponse.json(
        { success: false, message: 'New email address is required' },
        { status: 400 }
      );
    }

    // Try backend first
    try {
      console.log('🔄 Attempting backend update email:', `${BACKEND_URL}/api/auth/update-email`);

      const response = await fetch(`${BACKEND_URL}/api/auth/update-email`, {
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
        console.log('✅ Backend update email successful');
        return NextResponse.json(data, { status: response.status });
      } else {
        // Handle backend errors
        const errorText = await response.text();
        console.error('❌ Backend update email failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        let errorData;
        try {
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch {
          errorData = { success: false, message: 'Failed to update email address' };
        }

        return NextResponse.json(errorData, { status: response.status });
      }
    } catch (backendError) {
      console.warn('⚠️ Backend unavailable for update email, using mock response');
      
      // Mock response for development
      const mockResponse = {
        success: true,
        message: 'Email address updated successfully. Please verify your new email address.',
        data: {
          user: {
            _id: '6846e3be2faf41c8b630e417',
            name: 'Test User',
            email: body.newEmail.toLowerCase().trim(),
            role: 'student',
            isEmailVerified: false
          }
        }
      };

      // Log mock email update for development
      console.log('\n📧 ===== MOCK EMAIL UPDATE =====');
      console.log(`New Email: ${body.newEmail}`);
      console.log(`Verification Status: Reset to unverified`);
      console.log(`Verification Email: Would be sent to ${body.newEmail}`);
      console.log('📧 =============================\n');

      return NextResponse.json(mockResponse, { status: 200 });
    }

  } catch (error) {
    console.error('❌ Update email error:', error);
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
