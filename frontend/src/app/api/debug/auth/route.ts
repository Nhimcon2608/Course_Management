import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get cookies for authentication
    const cookieStore = cookies();
    const authToken = cookieStore.get('authToken');
    const refreshToken = cookieStore.get('refreshToken');
    
    // Get all cookies
    const allCookies = cookieStore.getAll();

    return NextResponse.json({
      success: true,
      message: 'Authentication debug info',
      data: {
        authToken: authToken ? {
          name: authToken.name,
          value: authToken.value ? `${authToken.value.substring(0, 20)}...` : 'null',
          hasValue: !!authToken.value
        } : null,
        refreshToken: refreshToken ? {
          name: refreshToken.name,
          value: refreshToken.value ? `${refreshToken.value.substring(0, 20)}...` : 'null',
          hasValue: !!refreshToken.value
        } : null,
        allCookies: allCookies.map(cookie => ({
          name: cookie.name,
          hasValue: !!cookie.value,
          valueLength: cookie.value?.length || 0
        })),
        cookieCount: allCookies.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Debug error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
