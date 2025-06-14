import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    // Try backend first
    try {
      const backendUrl = `${BACKEND_URL}/api/instructor/stats`;

      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': request.headers.get('origin') || 'http://localhost:3000',
          'Cookie': request.headers.get('cookie') || '',
          'Authorization': request.headers.get('authorization') || '',
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (backendError) {
      console.warn('⚠️ Backend unavailable for instructor stats, using mock data:', (backendError as Error).message);
    }

    // Fallback to mock data
    console.log('🔄 Using mock instructor stats');

    const mockStats = {
      totalCourses: 3,
      totalStudents: 127,
      totalRevenue: 15420,
      averageRating: 4.7,
      publishedCourses: 2,
      draftCourses: 1,
      monthlyRevenue: 3240,
      monthlyEnrollments: 28
    };

    return NextResponse.json(mockStats);

  } catch (error) {
    console.error('Get instructor stats error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve instructor statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
