import { connectDB } from './mongodb';

// Cache for database queries (5 minutes TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

export interface CourseData {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  price: number;
  level: string;
  duration: string;
  thumbnail: string;
  enrolledStudents: number;
  rating: number;
  totalRatings: number;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  instructor: {
    _id: string;
    name: string;
    email: string;
    bio?: string;
    specializations?: string[];
  };
  isPublished: boolean;
  status: string;
  slug: string;
}

export interface CategoryData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  courseCount: number;
  isActive: boolean;
  featured?: boolean;
  order: number;
}

export interface InstructorData {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  specializations?: string[];
  experience?: string;
  education?: string[];
  courseCount: number;
  totalStudents: number;
  averageRating: number;
}

export interface CouponData {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validTo: string;
  remainingUsage: number;
}

export async function getChatDatabaseContext(): Promise<{
  categories: CategoryData[];
  courses: CourseData[];
  instructors: InstructorData[];
  coupons: CouponData[];
  stats: {
    totalCourses: number;
    totalStudents: number;
    totalInstructors: number;
    totalCategories: number;
    totalCoupons: number;
  };
}> {
  const cacheKey = 'chat-database-context';
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const db = await connectDB();
    
    // Get categories with course counts
    const categories = await db.collection('categories').aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'category',
          as: 'courses'
        }
      },
      {
        $addFields: {
          courseCount: { $size: '$courses' }
        }
      },
      {
        $project: {
          courses: 0
        }
      },
      { $sort: { order: 1, name: 1 } }
    ]).toArray();

    // Get published courses with category and instructor info
    const courses = await db.collection('courses').aggregate([
      {
        $match: {
          isPublished: true,
          status: 'published'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'instructor',
          foreignField: '_id',
          as: 'instructor'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $unwind: '$instructor'
      },
      {
        $project: {
          title: 1,
          description: 1,
          shortDescription: 1,
          price: 1,
          level: 1,
          duration: 1,
          thumbnail: 1,
          enrolledStudents: 1,
          rating: 1,
          totalRatings: 1,
          slug: 1,
          isPublished: 1,
          status: 1,
          'category._id': 1,
          'category.name': 1,
          'category.slug': 1,
          'instructor._id': 1,
          'instructor.name': 1,
          'instructor.email': 1,
          'instructor.bio': 1,
          'instructor.specializations': 1
        }
      },
      { $sort: { enrolledStudents: -1, rating: -1 } },
      { $limit: 100 } // Limit for performance
    ]).toArray();

    console.log('📚 Sample course data:', courses.slice(0, 2).map(c => ({
      title: c.title,
      thumbnail: c.thumbnail,
      hasThumbnail: !!c.thumbnail
    })));

    // Get instructors with stats
    const instructors = await db.collection('users').aggregate([
      { $match: { role: 'instructor' } },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'instructor',
          as: 'courses'
        }
      },
      {
        $addFields: {
          courseCount: { $size: '$courses' },
          totalStudents: { $sum: '$courses.enrolledStudents' },
          averageRating: { $avg: '$courses.rating' }
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          bio: 1,
          avatar: 1,
          specializations: 1,
          experience: 1,
          education: 1,
          courseCount: 1,
          totalStudents: 1,
          averageRating: 1
        }
      },
      { $sort: { courseCount: -1, totalStudents: -1 } }
    ]).toArray();

    // Get active coupons
    let coupons: CouponData[] = [];
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const couponsResponse = await fetch(`${apiUrl}/coupons/public`);
      console.log('🎫 Fetching coupons from:', `${apiUrl}/coupons/public`);

      if (couponsResponse.ok) {
        const couponsData = await couponsResponse.json();
        coupons = couponsData.success ? couponsData.data : [];
        console.log('🎫 Fetched coupons:', coupons.length);
      } else {
        console.error('🎫 Coupons API error:', couponsResponse.status, couponsResponse.statusText);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      // Fallback to mock data for testing
      coupons = [
        {
          _id: '1',
          code: 'WELCOME20',
          discountType: 'percentage',
          discountValue: 20,
          minOrderAmount: 500000,
          maxDiscount: 200000,
          validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          remainingUsage: 100
        },
        {
          _id: '2',
          code: 'SAVE100K',
          discountType: 'fixed',
          discountValue: 100000,
          minOrderAmount: 1000000,
          validTo: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
          remainingUsage: 50
        },
        {
          _id: '3',
          code: 'STUDENT15',
          discountType: 'percentage',
          discountValue: 15,
          minOrderAmount: 300000,
          maxDiscount: 150000,
          validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
          remainingUsage: 200
        }
      ];
      console.log('🎫 Using mock coupon data:', coupons.length);
    }

    // Get overall stats
    const stats = {
      totalCourses: courses.length,
      totalStudents: courses.reduce((sum, course) => sum + (course.enrolledStudents || 0), 0),
      totalInstructors: instructors.length,
      totalCategories: categories.length,
      totalCoupons: coupons.length
    };

    const result = {
      categories: categories as CategoryData[],
      courses: courses as CourseData[],
      instructors: instructors as InstructorData[],
      coupons: coupons as CouponData[],
      stats
    };

    setCachedData(cacheKey, result);
    return result;

  } catch (error) {
    console.error('Error fetching chat database context:', error);
    
    // Return fallback data
    return {
      categories: [],
      courses: [],
      instructors: [],
      coupons: [],
      stats: {
        totalCourses: 0,
        totalStudents: 0,
        totalInstructors: 0,
        totalCategories: 0,
        totalCoupons: 0
      }
    };
  }
}

export async function searchCourses(query: string, category?: string): Promise<CourseData[]> {
  const cacheKey = `search-courses-${query}-${category || 'all'}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const db = await connectDB();
    
    const searchFilter: any = {
      isPublished: true,
      status: 'published',
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { shortDescription: { $regex: query, $options: 'i' } }
      ]
    };

    if (category) {
      const categoryDoc = await db.collection('categories').findOne({
        $or: [{ slug: category }, { name: { $regex: category, $options: 'i' } }]
      });
      
      if (categoryDoc) {
        searchFilter.category = categoryDoc._id;
      }
    }

    const courses = await db.collection('courses').aggregate([
      { $match: searchFilter },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'instructor',
          foreignField: '_id',
          as: 'instructor'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $unwind: '$instructor'
      },
      {
        $project: {
          title: 1,
          description: 1,
          shortDescription: 1,
          price: 1,
          level: 1,
          duration: 1,
          thumbnail: 1,
          enrolledStudents: 1,
          rating: 1,
          totalRatings: 1,
          slug: 1,
          'category._id': 1,
          'category.name': 1,
          'category.slug': 1,
          'instructor._id': 1,
          'instructor.name': 1,
          'instructor.email': 1,
          'instructor.bio': 1
        }
      },
      { $sort: { rating: -1, enrolledStudents: -1 } },
      { $limit: 10 }
    ]).toArray();

    setCachedData(cacheKey, courses);
    return courses as CourseData[];

  } catch (error) {
    console.error('Error searching courses:', error);
    return [];
  }
}
