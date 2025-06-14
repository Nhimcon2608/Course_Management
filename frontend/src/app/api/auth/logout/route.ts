import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing logout request');
    
    // Try backend first
    try {
      console.log('🔄 Attempting backend logout:', `${BACKEND_URL}/api/auth/logout`);
      
      const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': request.headers.get('origin') || 'http://localhost:3001',
          'Cookie': request.headers.get('cookie') || '',
          'Authorization': request.headers.get('authorization') || '',
        },
      });

      console.log('📡 Backend logout response status:', response.status);
      
      if (response.ok) {
        const responseText = await response.text();
        const data = responseText ? JSON.parse(responseText) : { success: true, message: 'Logged out successfully' };
        
        const nextResponse = NextResponse.json(data, { status: response.status });
        
        // Forward cookie clearing from backend
        const setCookieHeaders = response.headers.getSetCookie?.() || [];
        if (setCookieHeaders.length > 0) {
          console.log('🍪 Clearing cookies from backend:', setCookieHeaders.length);
          setCookieHeaders.forEach(cookie => {
            nextResponse.headers.append('Set-Cookie', cookie);
          });
        }
        
        console.log('✅ Backend logout successful');
        return nextResponse;
      }
    } catch (backendError) {
      console.warn('⚠️ Backend unavailable for logout, clearing cookies locally');
    }
    
    // Fallback to local logout (clear cookies)
    console.log('🔄 Performing local logout');
    
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully (local)' },
      { status: 200 }
    );
    
    // Clear all authentication cookies
    const cookieOptions = 'Path=/; HttpOnly; SameSite=Strict; Max-Age=0';
    response.headers.append('Set-Cookie', `accessToken=; ${cookieOptions}`);
    response.headers.append('Set-Cookie', `refreshToken=; ${cookieOptions}`);
    response.headers.append('Set-Cookie', `rememberMe=; ${cookieOptions}`);
    
    console.log('✅ Local logout successful');
    return response;
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    
    // Even on error, clear cookies for security
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
    
    const cookieOptions = 'Path=/; HttpOnly; SameSite=Strict; Max-Age=0';
    response.headers.append('Set-Cookie', `accessToken=; ${cookieOptions}`);
    response.headers.append('Set-Cookie', `refreshToken=; ${cookieOptions}`);
    response.headers.append('Set-Cookie', `rememberMe=; ${cookieOptions}`);
    
    return response;
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
