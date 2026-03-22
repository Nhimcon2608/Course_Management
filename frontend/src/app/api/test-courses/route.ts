import { NextRequest, NextResponse } from 'next/server';
import { getChatDatabaseContext, searchCourses } from '@/lib/chatDatabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing course data retrieval...');
    
    // Test database context
    const dbContext = await getChatDatabaseContext();
    console.log('📊 Database context:', {
      totalCourses: dbContext.courses.length,
      coursesWithThumbnails: dbContext.courses.filter(c => c.thumbnail).length,
      sampleCourse: dbContext.courses[0] ? {
        title: dbContext.courses[0].title,
        thumbnail: dbContext.courses[0].thumbnail,
        hasThumbnail: !!dbContext.courses[0].thumbnail
      } : null
    });

    // Test search
    const searchResults = await searchCourses('React');
    console.log('🔍 Search results:', {
      totalResults: searchResults.length,
      resultsWithThumbnails: searchResults.filter(c => c.thumbnail).length,
      sampleResult: searchResults[0] ? {
        title: searchResults[0].title,
        thumbnail: searchResults[0].thumbnail,
        hasThumbnail: !!searchResults[0].thumbnail
      } : null
    });

    return NextResponse.json({
      success: true,
      data: {
        totalCourses: dbContext.courses.length,
        coursesWithThumbnails: dbContext.courses.filter(c => c.thumbnail).length,
        searchResults: searchResults.length,
        searchResultsWithThumbnails: searchResults.filter(c => c.thumbnail).length,
        sampleCourses: dbContext.courses.slice(0, 3).map(c => ({
          title: c.title,
          thumbnail: c.thumbnail,
          hasThumbnail: !!c.thumbnail
        })),
        sampleSearchResults: searchResults.slice(0, 3).map(c => ({
          title: c.title,
          thumbnail: c.thumbnail,
          hasThumbnail: !!c.thumbnail
        }))
      }
    });

  } catch (error) {
    console.error('❌ Test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
