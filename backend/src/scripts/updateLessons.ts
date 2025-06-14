import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Course from '../models/Course';

// Complete lesson templates for different course types
const completeLessonTemplates = {
  'react-js': [
    {
      title: 'Bài học 1: Giới thiệu về React.js',
      description: 'Tìm hiểu về React.js, lịch sử phát triển và tại sao nó trở thành thư viện phổ biến nhất cho việc xây dựng giao diện người dùng.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 25,
      order: 1,
      isPreview: true
    },
    {
      title: 'Bài học 2: Cài đặt môi trường phát triển',
      description: 'Hướng dẫn cài đặt Node.js, npm, và tạo ứng dụng React đầu tiên với Create React App.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 30,
      order: 2,
      isPreview: false
    },
    {
      title: 'Bài học 3: JSX và Components cơ bản',
      description: 'Tìm hiểu về JSX syntax và cách tạo các React components đầu tiên.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
      duration: 35,
      order: 3,
      isPreview: false
    },
    {
      title: 'Bài học 4: Props và State',
      description: 'Học cách truyền dữ liệu giữa các components thông qua props và quản lý state.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 40,
      order: 4,
      isPreview: false
    },
    {
      title: 'Bài học 5: Event Handling',
      description: 'Xử lý các sự kiện người dùng như click, submit form, và keyboard events.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 28,
      order: 5,
      isPreview: false
    },
    {
      title: 'Bài học 6: React Hooks - useState và useEffect',
      description: 'Tìm hiểu về React Hooks và cách sử dụng useState và useEffect trong functional components.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
      duration: 45,
      order: 6,
      isPreview: false
    },
    {
      title: 'Bài học 7: Conditional Rendering và Lists',
      description: 'Học cách render có điều kiện và hiển thị danh sách dữ liệu trong React.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 32,
      order: 7,
      isPreview: false
    },
    {
      title: 'Bài học 8: Forms và Controlled Components',
      description: 'Xây dựng và xử lý forms trong React với controlled components.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 38,
      order: 8,
      isPreview: false
    },
    {
      title: 'Bài học 9: React Router và Navigation',
      description: 'Tạo ứng dụng single-page với React Router và quản lý navigation.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
      duration: 42,
      order: 9,
      isPreview: false
    },
    {
      title: 'Bài học 10: Context API và State Management',
      description: 'Quản lý state toàn cục với Context API và giới thiệu về Redux.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 48,
      order: 10,
      isPreview: false
    }
  ],
  'digital-marketing': [
    {
      title: 'Bài học 1: Giới thiệu về Digital Marketing',
      description: 'Tổng quan về digital marketing, các kênh marketing online và xu hướng hiện tại.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 30,
      order: 1,
      isPreview: true
    },
    {
      title: 'Bài học 2: Xây dựng chiến lược Marketing',
      description: 'Học cách xây dựng chiến lược marketing hiệu quả và xác định target audience.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 35,
      order: 2,
      isPreview: false
    },
    {
      title: 'Bài học 3: SEO cơ bản',
      description: 'Tìm hiểu về Search Engine Optimization và cách tối ưu hóa website cho công cụ tìm kiếm.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
      duration: 42,
      order: 3,
      isPreview: false
    },
    {
      title: 'Bài học 4: Google Ads và PPC',
      description: 'Hướng dẫn tạo và quản lý chiến dịch quảng cáo Google Ads hiệu quả.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 38,
      order: 4,
      isPreview: false
    },
    {
      title: 'Bài học 5: Social Media Marketing',
      description: 'Chiến lược marketing trên các nền tảng mạng xã hội như Facebook, Instagram, TikTok.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 40,
      order: 5,
      isPreview: false
    },
    {
      title: 'Bài học 6: Email Marketing',
      description: 'Xây dựng chiến dịch email marketing và tự động hóa quy trình chăm sóc khách hàng.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
      duration: 33,
      order: 6,
      isPreview: false
    },
    {
      title: 'Bài học 7: Content Marketing',
      description: 'Tạo nội dung hấp dẫn và xây dựng thương hiệu thông qua content marketing.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 36,
      order: 7,
      isPreview: false
    },
    {
      title: 'Bài học 8: Analytics và đo lường hiệu quả',
      description: 'Sử dụng Google Analytics và các công cụ đo lường để theo dõi hiệu quả marketing.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 44,
      order: 8,
      isPreview: false
    },
    {
      title: 'Bài học 9: Influencer Marketing',
      description: 'Chiến lược hợp tác với influencer và KOL để mở rộng tầm ảnh hưởng thương hiệu.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
      duration: 35,
      order: 9,
      isPreview: false
    }
  ],
  'nodejs': [
    {
      title: 'Bài học 1: Giới thiệu về Node.js',
      description: 'Tìm hiểu về Node.js, V8 engine và tại sao Node.js phù hợp cho backend development.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 28,
      order: 1,
      isPreview: true
    },
    {
      title: 'Bài học 2: Cài đặt và cấu hình môi trường',
      description: 'Hướng dẫn cài đặt Node.js, npm và thiết lập môi trường phát triển.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 25,
      order: 2,
      isPreview: false
    },
    {
      title: 'Bài học 3: Modules và NPM',
      description: 'Tìm hiểu về hệ thống modules trong Node.js và quản lý packages với NPM.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
      duration: 35,
      order: 3,
      isPreview: false
    },
    {
      title: 'Bài học 4: File System và Path',
      description: 'Làm việc với file system, đọc/ghi file và xử lý đường dẫn trong Node.js.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 32,
      order: 4,
      isPreview: false
    },
    {
      title: 'Bài học 5: HTTP Server và Express.js',
      description: 'Tạo HTTP server với Node.js thuần và giới thiệu về Express.js framework.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 40,
      order: 5,
      isPreview: false
    },
    {
      title: 'Bài học 6: Routing và Middleware',
      description: 'Xây dựng hệ thống routing và sử dụng middleware trong Express.js.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
      duration: 38,
      order: 6,
      isPreview: false
    },
    {
      title: 'Bài học 7: Database Integration',
      description: 'Kết nối và làm việc với cơ sở dữ liệu MongoDB và MySQL.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 45,
      order: 7,
      isPreview: false
    },
    {
      title: 'Bài học 8: Authentication và Authorization',
      description: 'Xây dựng hệ thống xác thực và phân quyền với JWT và Passport.js.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 42,
      order: 8,
      isPreview: false
    }
  ],
  'python': [
    {
      title: 'Bài học 1: Giới thiệu về Python',
      description: 'Tìm hiểu về ngôn ngữ lập trình Python, lịch sử và ứng dụng trong thực tế.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 30,
      order: 1,
      isPreview: true
    },
    {
      title: 'Bài học 2: Cài đặt Python và IDE',
      description: 'Hướng dẫn cài đặt Python, pip và thiết lập môi trường phát triển với PyCharm/VSCode.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 25,
      order: 2,
      isPreview: false
    },
    {
      title: 'Bài học 3: Biến và kiểu dữ liệu',
      description: 'Học về các kiểu dữ liệu cơ bản trong Python: int, float, string, boolean.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
      duration: 35,
      order: 3,
      isPreview: false
    },
    {
      title: 'Bài học 4: Cấu trúc điều khiển',
      description: 'Tìm hiểu về if/else, loops (for, while) và cách sử dụng chúng hiệu quả.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 40,
      order: 4,
      isPreview: false
    },
    {
      title: 'Bài học 5: Functions và Modules',
      description: 'Tạo và sử dụng functions, import modules và tổ chức code hiệu quả.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 38,
      order: 5,
      isPreview: false
    },
    {
      title: 'Bài học 6: Data Structures',
      description: 'Làm việc với lists, tuples, dictionaries và sets trong Python.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
      duration: 42,
      order: 6,
      isPreview: false
    },
    {
      title: 'Bài học 7: Object-Oriented Programming',
      description: 'Tìm hiểu về lập trình hướng đối tượng trong Python: classes, objects, inheritance.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 45,
      order: 7,
      isPreview: false
    },
    {
      title: 'Bài học 8: Data Science với Pandas và NumPy',
      description: 'Giới thiệu về Data Science và sử dụng thư viện Pandas, NumPy để xử lý dữ liệu.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 50,
      order: 8,
      isPreview: false
    }
  ],
  'uiux': [
    {
      title: 'Bài học 1: Giới thiệu về UI/UX Design',
      description: 'Tìm hiểu về UI/UX Design, sự khác biệt giữa UI và UX, và tầm quan trọng trong thiết kế sản phẩm.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 32,
      order: 1,
      isPreview: true
    },
    {
      title: 'Bài học 2: Giới thiệu về Figma',
      description: 'Làm quen với giao diện Figma, các công cụ cơ bản và thiết lập workspace.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 28,
      order: 2,
      isPreview: false
    },
    {
      title: 'Bài học 3: Design Principles',
      description: 'Các nguyên tắc thiết kế cơ bản: contrast, alignment, repetition, proximity.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
      duration: 35,
      order: 3,
      isPreview: false
    },
    {
      title: 'Bài học 4: Typography và Color Theory',
      description: 'Tìm hiểu về typography, cách chọn font chữ và lý thuyết màu sắc trong thiết kế.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 40,
      order: 4,
      isPreview: false
    },
    {
      title: 'Bài học 5: Wireframing và Prototyping',
      description: 'Tạo wireframe và prototype trong Figma để thể hiện ý tưởng thiết kế.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 45,
      order: 5,
      isPreview: false
    },
    {
      title: 'Bài học 6: User Research và Testing',
      description: 'Phương pháp nghiên cứu người dùng và testing để cải thiện trải nghiệm người dùng.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
      duration: 38,
      order: 6,
      isPreview: false
    },
    {
      title: 'Bài học 7: Responsive Design',
      description: 'Thiết kế responsive cho các thiết bị khác nhau: desktop, tablet, mobile.',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 42,
      order: 7,
      isPreview: false
    }
  ]
};

// Function to determine lesson template based on course title/slug
function getLessonTemplate(course: any): any[] {
  const title = course.title.toLowerCase();
  const slug = course.slug.toLowerCase();

  if (title.includes('react') || slug.includes('react')) {
    return completeLessonTemplates['react-js'];
  } else if (title.includes('digital marketing') || title.includes('marketing') || slug.includes('marketing')) {
    return completeLessonTemplates['digital-marketing'];
  } else if (title.includes('node') || title.includes('nodejs') || slug.includes('node')) {
    return completeLessonTemplates['nodejs'];
  } else if (title.includes('python') || slug.includes('python')) {
    return completeLessonTemplates['python'];
  } else if (title.includes('ui/ux') || title.includes('figma') || slug.includes('uiux') || slug.includes('figma')) {
    return completeLessonTemplates['uiux'];
  } else {
    // Return a generic template for other courses
    return [
      {
        title: 'Bài học 1: Giới thiệu khóa học',
        description: 'Tổng quan về khóa học, mục tiêu học tập và lộ trình chi tiết.',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        duration: 25,
        order: 1,
        isPreview: true
      },
      {
        title: 'Bài học 2: Kiến thức cơ bản',
        description: 'Các khái niệm và kiến thức nền tảng cần thiết cho khóa học.',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
        duration: 30,
        order: 2,
        isPreview: false
      },
      {
        title: 'Bài học 3: Thực hành đầu tiên',
        description: 'Bài tập thực hành đầu tiên để áp dụng kiến thức đã học.',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
        duration: 35,
        order: 3,
        isPreview: false
      },
      {
        title: 'Bài học 4: Kỹ thuật nâng cao',
        description: 'Tìm hiểu các kỹ thuật và phương pháp nâng cao trong lĩnh vực.',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        duration: 40,
        order: 4,
        isPreview: false
      },
      {
        title: 'Bài học 5: Dự án thực tế',
        description: 'Xây dựng dự án thực tế để áp dụng toàn bộ kiến thức đã học.',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
        duration: 45,
        order: 5,
        isPreview: false
      },
      {
        title: 'Bài học 6: Tổng kết và hướng phát triển',
        description: 'Tổng kết kiến thức đã học và hướng dẫn phát triển tiếp theo.',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
        duration: 30,
        order: 6,
        isPreview: false
      }
    ];
  }
}

async function updateLessons() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all courses
    const courses = await Course.find({});
    console.log(`📚 Found ${courses.length} courses to update with complete lessons`);

    let updatedCount = 0;

    for (const course of courses) {
      console.log(`\n🔄 Processing "${course.title}"...`);
      console.log(`   Current lessons: ${course.lessons?.length || 0}`);

      // Get appropriate lesson template
      const lessonTemplate = getLessonTemplate(course);

      // Replace all lessons with complete template
      course.lessons = lessonTemplate.map(lesson => ({
        ...lesson,
        _id: new mongoose.Types.ObjectId()
      }));

      // Update course duration based on lessons
      const totalDuration = lessonTemplate.reduce((total, lesson) => total + lesson.duration, 0);
      course.duration = Math.round(totalDuration / 60 * 10) / 10; // Convert to hours and round to 1 decimal

      // Save course
      await course.save();

      console.log(`✅ Updated "${course.title}" with ${lessonTemplate.length} lessons (${totalDuration} minutes total)`);
      updatedCount++;
    }

    console.log('\n🎉 Lesson update completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Updated courses: ${updatedCount}`);
    console.log(`   - Total courses: ${courses.length}`);

  } catch (error) {
    console.error('❌ Error updating lessons:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the update
if (require.main === module) {
  updateLessons();
}

export default updateLessons;
