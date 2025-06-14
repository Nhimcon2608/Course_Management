import { Course, Category, Review } from './api';

// Mock Categories Data
export const mockCategories: Category[] = [
  {
    _id: '1',
    name: 'Web Development',
    slug: 'web-development',
    description: 'Learn modern web development technologies',
    icon: '💻',
    color: 'bg-blue-500',
    level: 0,
    order: 1,
    isActive: true,
    featured: true,
    courseCount: 45,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: '2',
    name: 'Data Science',
    slug: 'data-science',
    description: 'Master data analysis and machine learning',
    icon: '📊',
    color: 'bg-green-500',
    level: 0,
    order: 2,
    isActive: true,
    featured: true,
    courseCount: 32,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: '3',
    name: 'Mobile Development',
    slug: 'mobile-development',
    description: 'Build mobile apps for iOS and Android',
    icon: '📱',
    color: 'bg-purple-500',
    level: 0,
    order: 3,
    isActive: true,
    featured: false,
    courseCount: 28,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: '4',
    name: 'UI/UX Design',
    slug: 'ui-ux-design',
    description: 'Create beautiful and user-friendly designs',
    icon: '🎨',
    color: 'bg-pink-500',
    level: 0,
    order: 4,
    isActive: true,
    featured: true,
    courseCount: 24,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: '5',
    name: 'Digital Marketing',
    slug: 'digital-marketing',
    description: 'Learn marketing strategies for the digital age',
    icon: '📈',
    color: 'bg-orange-500',
    level: 0,
    order: 5,
    isActive: true,
    featured: false,
    courseCount: 18,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: '6',
    name: 'Cybersecurity',
    slug: 'cybersecurity',
    description: 'Protect systems and networks from cyber threats',
    icon: '🔒',
    color: 'bg-red-500',
    level: 0,
    order: 6,
    isActive: true,
    featured: true,
    courseCount: 15,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// Mock Courses Data
export const mockCourses: Course[] = [
  {
    _id: '1',
    title: 'Complete React Development Course',
    slug: 'complete-react-development',
    description: 'Learn React from basics to advanced concepts with hands-on projects. This comprehensive course covers everything you need to know to become a proficient React developer.',
    shortDescription: 'Learn React from basics to advanced concepts with hands-on projects',
    instructor: {
      _id: 'instructor1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      bio: 'Senior React Developer with 8+ years of experience'
    },
    category: mockCategories[0],
    price: 99.99,
    originalPrice: 199.99,
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
    images: ['https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400'],
    level: 'beginner',
    duration: 40,
    lessons: [
      {
        _id: 'lesson1',
        title: 'Introduction to React',
        description: 'Learn the basics of React and JSX',
        duration: 30,
        order: 1,
        isPreview: true,
        resources: []
      },
      {
        _id: 'lesson2',
        title: 'Components and Props',
        description: 'Understanding React components and props',
        duration: 45,
        order: 2,
        isPreview: false,
        resources: []
      },
      {
        _id: 'lesson3',
        title: 'State and Lifecycle',
        description: 'Managing component state and lifecycle methods',
        duration: 60,
        order: 3,
        isPreview: false,
        resources: []
      }
    ],
    requirements: [
      'Basic knowledge of HTML, CSS, and JavaScript',
      'Familiarity with ES6+ features',
      'A computer with internet connection'
    ],
    whatYouWillLearn: [
      'Build modern React applications',
      'Understand React hooks and context',
      'Implement state management with Redux',
      'Create responsive user interfaces',
      'Deploy React applications to production'
    ],
    tags: ['React', 'JavaScript', 'Frontend', 'Web Development'],
    isPublished: true,
    enrolledStudents: 15420,
    rating: 4.8,
    totalRatings: 1250,
    language: 'english',
    subtitles: ['english'],
    certificate: true,
    featured: true,
    status: 'published',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    totalLessons: 3,
    totalDurationMinutes: 135,
    discountPercentage: 50
  },
  {
    _id: '2',
    title: 'Python for Data Science',
    slug: 'python-data-science',
    description: 'Master Python programming for data analysis and machine learning. Learn pandas, numpy, matplotlib, and scikit-learn.',
    shortDescription: 'Master Python programming for data analysis and machine learning',
    instructor: {
      _id: 'instructor2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      bio: 'Data Scientist with PhD in Statistics'
    },
    category: mockCategories[1],
    price: 79.99,
    originalPrice: 149.99,
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
    images: ['https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400'],
    level: 'intermediate',
    duration: 35,
    lessons: [
      {
        _id: 'lesson4',
        title: 'Python Fundamentals',
        description: 'Basic Python syntax and data structures',
        duration: 40,
        order: 1,
        isPreview: true,
        resources: []
      },
      {
        _id: 'lesson5',
        title: 'NumPy and Pandas',
        description: 'Data manipulation with NumPy and Pandas',
        duration: 50,
        order: 2,
        isPreview: false,
        resources: []
      }
    ],
    requirements: [
      'Basic programming knowledge',
      'High school mathematics',
      'Python installed on your computer'
    ],
    whatYouWillLearn: [
      'Python programming fundamentals',
      'Data manipulation with Pandas',
      'Data visualization with Matplotlib',
      'Machine learning with Scikit-learn',
      'Statistical analysis techniques'
    ],
    tags: ['Python', 'Data Science', 'Machine Learning', 'Analytics'],
    isPublished: true,
    enrolledStudents: 12300,
    rating: 4.7,
    totalRatings: 890,
    language: 'english',
    subtitles: ['english'],
    certificate: true,
    featured: false,
    status: 'published',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    totalLessons: 2,
    totalDurationMinutes: 90,
    discountPercentage: 47
  },
  {
    _id: '3',
    title: 'UI/UX Design Masterclass',
    slug: 'ui-ux-design-masterclass',
    description: 'Create stunning user interfaces and experiences. Learn design principles, prototyping, and user research.',
    shortDescription: 'Create stunning user interfaces and experiences',
    instructor: {
      _id: 'instructor3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: 'Senior UX Designer at top tech companies'
    },
    category: mockCategories[3],
    price: 89.99,
    originalPrice: 179.99,
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
    images: ['https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400'],
    level: 'beginner',
    duration: 30,
    lessons: [
      {
        _id: 'lesson6',
        title: 'Design Principles',
        description: 'Fundamental principles of good design',
        duration: 35,
        order: 1,
        isPreview: true,
        resources: []
      }
    ],
    requirements: [
      'No prior design experience required',
      'Access to design software (Figma recommended)',
      'Creative mindset'
    ],
    whatYouWillLearn: [
      'Design thinking methodology',
      'User research techniques',
      'Wireframing and prototyping',
      'Visual design principles',
      'Usability testing'
    ],
    tags: ['UI Design', 'UX Design', 'Figma', 'Prototyping'],
    isPublished: true,
    enrolledStudents: 8900,
    rating: 4.9,
    totalRatings: 675,
    language: 'english',
    subtitles: ['english'],
    certificate: true,
    featured: true,
    status: 'published',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    totalLessons: 1,
    totalDurationMinutes: 35,
    discountPercentage: 50
  }
];

// Mock Reviews Data
export const mockReviews: Review[] = [
  {
    _id: 'review1',
    user: {
      _id: 'user1',
      name: 'Alice Johnson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
    },
    course: '1',
    rating: 5,
    comment: 'Excellent course! Very comprehensive and well-structured. The instructor explains everything clearly.',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    _id: 'review2',
    user: {
      _id: 'user2',
      name: 'Bob Smith',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    },
    course: '1',
    rating: 4,
    comment: 'Great content and practical examples. Would recommend to anyone learning React.',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z'
  },
  {
    _id: 'review3',
    user: {
      _id: 'user3',
      name: 'Carol Davis',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'
    },
    course: '2',
    rating: 5,
    comment: 'Perfect introduction to data science with Python. Very hands-on approach.',
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z'
  }
];
