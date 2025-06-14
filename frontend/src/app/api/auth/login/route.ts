import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Temporary mock data for testing when backend is unavailable
const MOCK_USERS: Record<string, any> = {
  'admin@coursemanagement.com': {
    _id: '6846e3be2faf41c8b630e417',
    name: 'Admin User',
    email: 'admin@coursemanagement.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    isEmailVerified: true,
    password: '123456'
  },
  'nguyenvanan@gmail.com': {
    _id: '6846e3be2faf41c8b630e418',
    name: 'Nguyễn Văn An',
    email: 'nguyenvanan@gmail.com',
    role: 'instructor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isEmailVerified: true,
    password: '123456'
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing login request');

    const body = await request.json();
    const { email, password, rememberMe = false } = body;

    // Try backend first
    try {
      console.log('🔄 Attempting backend login:', `${BACKEND_URL}/api/auth/login`);

      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': request.headers.get('origin') || 'http://localhost:3001',
          'User-Agent': request.headers.get('user-agent') || 'NextJS-Proxy',
        },
        body: JSON.stringify(body),
      });

      console.log('📡 Backend response status:', response.status);

      if (response.ok) {
        const responseText = await response.text();
        const data = responseText ? JSON.parse(responseText) : {};

        const nextResponse = NextResponse.json(data, { status: response.status });

        // Forward cookies from backend
        const setCookieHeaders = response.headers.getSetCookie?.() || [];
        if (setCookieHeaders.length > 0) {
          console.log('🍪 Setting cookies from backend:', setCookieHeaders.length);
          setCookieHeaders.forEach(cookie => {
            nextResponse.headers.append('Set-Cookie', cookie);
          });
        }

        console.log('✅ Backend login successful');
        return nextResponse;
      }
    } catch (backendError) {
      console.warn('⚠️ Backend unavailable, using mock authentication:', (backendError as Error).message);
    }

    // Fallback to mock authentication
    console.log('🔄 Using mock authentication for:', email);

    const user = MOCK_USERS[email as keyof typeof MOCK_USERS];
    if (!user || user.password !== password) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate mock tokens
    const accessToken = `mock-access-token-${Date.now()}`;
    const refreshToken = `mock-refresh-token-${Date.now()}`;

    // Create mock response
    const mockData = {
      success: true,
      message: 'Login successful (mock)',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          lastLogin: new Date().toISOString()
        },
        accessToken,
        refreshToken,
        rememberMe
      }
    };

    const nextResponse = NextResponse.json(mockData, { status: 200 });

    // Set mock cookies
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day

    nextResponse.headers.append('Set-Cookie', `accessToken=${accessToken}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Strict`);
    nextResponse.headers.append('Set-Cookie', `refreshToken=${refreshToken}; Max-Age=${maxAge * 7}; Path=/; HttpOnly; SameSite=Strict`);
    nextResponse.headers.append('Set-Cookie', `rememberMe=${rememberMe}; Max-Age=${maxAge * 7}; Path=/; SameSite=Strict`);

    console.log('✅ Mock login successful for:', user.name);
    return nextResponse;

  } catch (error) {
    console.error('❌ Login error:', error);
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
