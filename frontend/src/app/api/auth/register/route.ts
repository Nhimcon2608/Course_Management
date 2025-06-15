import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing registration request');

    const body = await request.json();
    console.log('📝 Registration data received:', {
      name: body.name,
      email: body.email,
      role: body.role,
      hasPassword: !!body.password,
      rememberMe: body.rememberMe
    });

    const { name, email, password, role = 'student', rememberMe = false } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['student', 'instructor'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Role must be either student or instructor' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }
    
    // In production or when backend is not available, use mock authentication
    const isProduction = process.env.NODE_ENV === 'production';
    const hasBackend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

    if (!isProduction && hasBackend) {
      // Try backend first only in development with backend URL
      try {
        console.log('🔄 Attempting backend registration:', `${BACKEND_URL}/api/auth/register`);

        const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': request.headers.get('origin') || 'http://localhost:3001',
            'User-Agent': request.headers.get('user-agent') || 'NextJS-Proxy',
          },
          body: JSON.stringify(body),
        });

        console.log('📡 Backend registration response status:', response.status);

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

          console.log('✅ Backend registration successful');
          return nextResponse;
        } else {
          // Handle backend errors
          const errorText = await response.text();
          console.error('❌ Backend registration failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });

          let errorData;
          try {
            errorData = errorText ? JSON.parse(errorText) : {};
          } catch {
            errorData = { success: false, message: 'Registration failed' };
          }

          return NextResponse.json(errorData, { status: response.status });
        }
      } catch (backendError) {
        console.warn('⚠️ Backend unavailable, using mock registration:', (backendError as Error).message);
      }
    } else {
      console.log('🔄 Using mock registration (production mode or no backend configured)');
    }
    
    // Fallback to mock registration
    console.log('🔄 Using mock registration for:', email);
    
    // Check if user already exists in mock data
    if (email in MOCK_USERS) {
      console.log('⚠️ User already exists in mock data:', email);
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Create new mock user
    const newUserId = `mock-user-${Date.now()}`;
    const newUser = {
      _id: newUserId,
      name,
      email,
      role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B82F6&color=fff`,
      isEmailVerified: false,
      password
    };
    
    // Add to mock users (in real app, this would be saved to database)
    MOCK_USERS[email] = newUser;
    
    // Generate mock tokens
    const accessToken = `mock-access-token-${Date.now()}`;
    const refreshToken = `mock-refresh-token-${Date.now()}`;
    
    // Create mock response
    const mockData = {
      success: true,
      message: 'Registration successful (mock)',
      data: {
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatar: newUser.avatar,
          isEmailVerified: newUser.isEmailVerified,
          lastLogin: new Date().toISOString()
        },
        accessToken,
        refreshToken,
        rememberMe
      }
    };
    
    const nextResponse = NextResponse.json(mockData, { status: 201 });
    
    // Set mock cookies
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
    
    nextResponse.headers.append('Set-Cookie', `accessToken=${accessToken}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Strict`);
    nextResponse.headers.append('Set-Cookie', `refreshToken=${refreshToken}; Max-Age=${maxAge * 7}; Path=/; HttpOnly; SameSite=Strict`);
    nextResponse.headers.append('Set-Cookie', `rememberMe=${rememberMe}; Max-Age=${maxAge * 7}; Path=/; SameSite=Strict`);
    
    console.log('✅ Mock registration successful for:', newUser.name);
    return nextResponse;
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
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

// Import mock users from login route to maintain consistency
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
