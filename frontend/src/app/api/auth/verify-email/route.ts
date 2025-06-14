import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Enhanced in-memory cache to prevent duplicate requests
const processingTokens = new Map<string, number>(); // token -> timestamp

// Cleanup tokens older than 30 seconds
const cleanupExpiredTokens = () => {
  const now = Date.now();
  const expiredTokens: string[] = [];

  processingTokens.forEach((timestamp, token) => {
    if (now - timestamp > 30000) { // 30 seconds
      expiredTokens.push(token);
    }
  });

  expiredTokens.forEach(token => {
    console.log(`🧹 Cleaning up expired token: ${token.substring(0, 10)}...`);
    processingTokens.delete(token);
  });
};

// Run cleanup every 10 seconds
setInterval(cleanupExpiredTokens, 10000);

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Processing verify email request');

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    console.log(`🔍 Frontend API received token: ${token ? token.substring(0, 10) + '...' : 'undefined'}`);
    console.log(`🔍 Full frontend token: ${token || 'undefined'}`);
    console.log(`🔍 Frontend token length: ${token ? token.length : 0}`);

    // Validate token
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Cleanup expired tokens first
    cleanupExpiredTokens();

    // Check if token is already being processed
    if (processingTokens.has(token)) {
      const processingTime = Date.now() - processingTokens.get(token)!;
      console.log(`⚠️ DUPLICATE REQUEST BLOCKED: Token already being processed: ${token.substring(0, 10)}... (${processingTime}ms ago)`);
      console.log(`🔍 Currently processing tokens: ${processingTokens.size}`);
      return NextResponse.json(
        { success: false, message: 'Verification already in progress, please wait...' },
        { status: 429 }
      );
    }

    // Mark token as being processed with timestamp
    processingTokens.set(token, Date.now());
    console.log(`🔒 Token marked as processing: ${token.substring(0, 10)}... (Total: ${processingTokens.size})`);

    // Try backend first
    try {
      console.log('🔄 Attempting backend verify email:', `${BACKEND_URL}/api/auth/verify-email`);

      const response = await fetch(`${BACKEND_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
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
        console.log('✅ Backend verify email successful');

        // Remove token from processing map
        processingTokens.delete(token);
        console.log(`🔓 Token removed from processing: ${token.substring(0, 10)}... (Remaining: ${processingTokens.size})`);

        return NextResponse.json(data, { status: response.status });
      } else {
        // Handle backend errors
        const errorText = await response.text();
        console.error('❌ Backend verify email failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        let errorData;
        try {
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch {
          errorData = { success: false, message: 'Invalid or expired verification token' };
        }

        // Remove token from processing set
        processingTokens.delete(token);

        return NextResponse.json(errorData, { status: response.status });
      }
    } catch (backendError) {
      console.warn('⚠️ Backend unavailable for verify email, using mock response');

      // Remove token from processing set
      processingTokens.delete(token);

      // Mock response for development
      if (token.startsWith('mock-verification-token-')) {
        const mockResponse = {
          success: true,
          message: 'Email verified successfully! You now have full access to all features.',
          data: {
            user: {
              _id: '6846e3be2faf41c8b630e417',
              name: 'Test User',
              email: 'user@example.com',
              role: 'student',
              isEmailVerified: true
            }
          }
        };
        return NextResponse.json(mockResponse, { status: 200 });
      } else {
        const mockErrorResponse = {
          success: false,
          message: 'Invalid or expired verification token'
        };
        return NextResponse.json(mockErrorResponse, { status: 400 });
      }
    }

  } catch (error) {
    console.error('❌ Verify email error:', error);

    // Clean up processing token on error
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (token) {
      processingTokens.delete(token);
    }

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
