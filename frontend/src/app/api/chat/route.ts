import { NextRequest, NextResponse } from 'next/server';
import { getChatDatabaseContext, searchCourses } from '@/lib/chatDatabase';

const GEMINI_API_KEY = 'AIzaSyDn31g4ZhHI-i_2sgY30aPL12oAbuXTPIA';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Generate dynamic system context with database data
async function generateSystemContext() {
  try {
    const dbContext = await getChatDatabaseContext();
    console.log('📊 Database context loaded:', {
      categories: dbContext.categories.length,
      courses: dbContext.courses.length,
      instructors: dbContext.instructors.length,
      coupons: dbContext.coupons.length,
      categoriesWithIds: dbContext.categories.filter(c => c._id).length,
      coursesWithSlugs: dbContext.courses.filter(c => c.slug).length
    });

    const categoriesInfo = `
DANH MỤC KHÓA HỌC:
| Tên danh mục | Số khóa học | Mô tả | Link |
|---|---|---|---|
${dbContext.categories.map(cat =>
  `| ${cat.name} | ${cat.courseCount} | ${(cat.description || 'Khóa học chất lượng cao').substring(0, 30)}... | http://localhost:3000/categories/${cat._id} |`
).join('\n')}`;

    const topCoursesData = dbContext.courses
      .filter(course => course.slug && course.thumbnail)
      .slice(0, 6)
      .map(course => ({
        _id: course._id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        price: course.price,
        level: course.level,
        rating: course.rating,
        totalRatings: course.totalRatings,
        enrolledStudents: course.enrolledStudents,
        duration: course.duration,
        instructor: {
          name: course.instructor.name
        },
        category: {
          name: course.category.name,
          _id: course.category._id
        }
      }));

    console.log('🏆 Top courses data:', {
      totalCourses: dbContext.courses.length,
      coursesWithThumbnail: dbContext.courses.filter(c => c.thumbnail).length,
      topCoursesData: topCoursesData.length,
      sampleThumbnails: topCoursesData.slice(0, 2).map(c => ({ title: c.title, thumbnail: c.thumbnail }))
    });

    const topCourses = `
KHÓA HỌC NỔI BẬT:
| Tên khóa học | Cấp độ | Giá | Giảng viên |
|---|---|---|---|
${topCoursesData.map(course =>
  `| ${course.title} | ${course.level} | ${course.price.toLocaleString('vi-VN')}đ | ${course.instructor.name} |`
).join('\n')}

TOP_COURSES_DATA: ${JSON.stringify(topCoursesData)}`;

    console.log('📝 System context includes TOP_COURSES_DATA:', topCourses.includes('TOP_COURSES_DATA:'));
    console.log('📊 TOP_COURSES_DATA length:', JSON.stringify(topCoursesData).length);

    const topInstructors = dbContext.instructors.slice(0, 5).map(instructor =>
      `- ${instructor.name}: ${instructor.courseCount} khóa học, ${instructor.totalStudents} học viên, Rating: ${instructor.averageRating?.toFixed(1) || 'N/A'}/5`
    ).join('\n');

    const activeCoupons = dbContext.coupons.slice(0, 5).map(coupon => {
      const discount = coupon.discountType === 'percentage'
        ? `${coupon.discountValue}%`
        : `${coupon.discountValue.toLocaleString('vi-VN')}đ`;
      const validTo = new Date(coupon.validTo).toLocaleDateString('vi-VN');
      return `- ${coupon.code}: Giảm ${discount} (Tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ) - Hết hạn: ${validTo} - Còn lại: ${coupon.remainingUsage} lượt`;
    }).join('\n');

    return `
Bạn là trợ lý AI cho hệ thống quản lý khóa học trực tuyến. Hãy trả lời bằng tiếng Việt một cách thân thiện và hữu ích.

QUAN TRỌNG - HƯỚNG DẪN TRÌNH BÀY:
- Khi có dữ liệu COURSE_DATA hoặc COUPON_DATA trong context, KHÔNG lặp lại thông tin chi tiết
- Chỉ cần đề cập rằng "Dưới đây là thông tin chi tiết" và hệ thống sẽ tự động hiển thị
- KHÔNG tạo bảng HTML hoặc markdown table cho dữ liệu đã có trong JSON
- Tập trung vào tư vấn, giải thích và hướng dẫn sử dụng
- Sử dụng emoji và format đơn giản để làm đẹp văn bản

THỐNG KÊ HỆ THỐNG HIỆN TẠI:
- Tổng số khóa học: ${dbContext.stats.totalCourses}
- Tổng số học viên: ${dbContext.stats.totalStudents.toLocaleString('vi-VN')}
- Tổng số giảng viên: ${dbContext.stats.totalInstructors}
- Tổng số danh mục: ${dbContext.stats.totalCategories}
- Tổng số mã giảm giá: ${dbContext.stats.totalCoupons}

DANH MỤC KHÓA HỌC:
${categoriesInfo}

TOP KHÓA HỌC PHỔ BIẾN:
${topCourses}

GIẢNG VIÊN NỔI BẬT:
${topInstructors}

MÃ GIẢM GIÁ HIỆN TẠI:
${activeCoupons}

CÁC CHỦ ĐỀ BẠN CÓ THỂ HỖ TRỢ:
1. Thông tin chi tiết về khóa học cụ thể (giá, thời lượng, nội dung)
2. Gợi ý khóa học phù hợp theo nhu cầu
3. Thông tin về giảng viên và kinh nghiệm
4. Quy trình đăng ký và thanh toán
5. Chính sách hoàn tiền và chứng chỉ
6. Hỗ trợ kỹ thuật và sử dụng nền tảng
7. Mã giảm giá và chương trình khuyến mãi hiện tại

HƯỚNG DẪN TRÌNH BÀY:
- Khi có dữ liệu COURSE_DATA hoặc COUPON_DATA, hãy đề cập rằng hệ thống sẽ hiển thị thông tin chi tiết bên dưới
- Không cần lặp lại thông tin chi tiết đã có trong dữ liệu JSON
- Tập trung vào tư vấn và hướng dẫn sử dụng
- Sử dụng emoji và format markdown để làm đẹp văn bản

CÁCH TRẢ LỜI:
- Ngắn gọn, rõ ràng (tối đa 300 từ)
- Thân thiện và chuyên nghiệp
- Cung cấp thông tin cụ thể từ database khi có thể
- QUAN TRỌNG - Định dạng văn bản sạch sẽ:
  * KHÔNG sử dụng dấu sao (*) để làm đậm
  * KHÔNG sử dụng markdown syntax
  * Viết văn bản thuần túy, dễ đọc
  * Sử dụng dấu gạch đầu dòng (-) cho danh sách
- QUAN TRỌNG - Định dạng bảng khi liệt kê nhiều items:
  * Sử dụng format: | Cột 1 | Cột 2 | Cột 3 | Cột 4 |
  * Mỗi dòng bắt đầu và kết thúc bằng |
  * Phân cách các cột bằng |
  * Ví dụ: | Tên khóa học | Cấp độ | Giá | Giảng viên |
- QUAN TRỌNG - Định dạng links chính xác:
  * Luôn viết: "Link khóa học: http://localhost:3000/courses/course-slug"
  * Luôn viết: "Link danh mục: http://localhost:3000/categories/category-id"
  * Sử dụng slug cho courses, ObjectId cho categories
  * KHÔNG viết dạng markdown [text](url)
  * KHÔNG thêm dấu ngoặc vuông hoặc ký tự đặc biệt
- CỰC KỲ QUAN TRỌNG - Bảo toàn dữ liệu JSON:
  * Khi có COURSE_DATA hoặc TOP_COURSES_DATA trong context, PHẢI giữ nguyên trong response
  * KHÔNG được xóa, chỉnh sửa, hoặc bỏ qua các dòng JSON này
  * Đặt JSON data ở cuối response sau nội dung text
  * Format: COURSE_DATA: [JSON array] hoặc TOP_COURSES_DATA: [JSON array]
- Khi recommend khóa học, luôn kèm link trực tiếp
- Gợi ý câu hỏi tiếp theo liên quan
- Nếu không tìm thấy thông tin, hướng dẫn liên hệ support
`;
  } catch (error) {
    console.error('Error generating system context:', error);

    // Fallback static context
    return `
Bạn là trợ lý AI cho hệ thống quản lý khóa học trực tuyến. Hãy trả lời bằng tiếng Việt một cách thân thiện và hữu ích.

THÔNG TIN VỀ HỆ THỐNG:
- Hệ thống cung cấp các khóa học trực tuyến đa dạng
- Hỗ trợ đăng ký, thanh toán trực tuyến
- Có hệ thống giảng viên và học viên chuyên nghiệp
- Cung cấp chứng chỉ hoàn thành khóa học

CÁC CHỦ ĐỀ BẠN CÓ THỂ HỖ TRỢ:
1. Thông tin về khóa học và danh mục
2. Quy trình đăng ký và thanh toán
3. Hỗ trợ kỹ thuật cơ bản
4. Chính sách hoàn tiền và chứng chỉ

CÁCH TRẢ LỜI:
- Ngắn gọn, rõ ràng (tối đa 200 từ)
- Thân thiện và chuyên nghiệp
- Nếu không biết thông tin cụ thể, hãy hướng dẫn liên hệ support
`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Generate dynamic system context with database data
    const systemContext = await generateSystemContext();
    console.log('🎯 System context generated, checking for course data...');

    // Check if user is asking for specific course search or coupon info
    let additionalContext = '';
    const searchKeywords = ['tìm khóa học', 'khóa học về', 'học', 'course', 'tìm kiếm', 'gợi ý', 'recommend', 'khóa học', 'danh sách', 'liệt kê'];
    const couponKeywords = ['mã giảm giá', 'coupon', 'khuyến mãi', 'giảm giá', 'voucher', 'discount', 'mã giảm', 'ưu đãi'];

    const isSearchQuery = searchKeywords.some(keyword =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    const isCouponQuery = couponKeywords.some(keyword =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    console.log('🔍 Is search query:', isSearchQuery, 'Is coupon query:', isCouponQuery, 'for message:', message);

    if (isCouponQuery) {
      // Handle coupon queries
      try {
        const dbContext = await getChatDatabaseContext();
        const coupons = dbContext.coupons;

        if (coupons.length > 0) {
          const couponDataForDisplay = coupons.map(coupon => ({
            _id: coupon._id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            minOrderAmount: coupon.minOrderAmount,
            maxDiscount: coupon.maxDiscount,
            validTo: coupon.validTo,
            remainingUsage: coupon.remainingUsage
          }));

          additionalContext = `

Hiện tại có ${coupons.length} mã giảm giá đang hoạt động. Hệ thống sẽ hiển thị chi tiết các mã giảm giá bên dưới.

COUPON_DATA: ${JSON.stringify(couponDataForDisplay)}`;
        } else {
          additionalContext = '\n\nHiện tại không có mã giảm giá nào đang hoạt động. Vui lòng theo dõi website để cập nhật các chương trình khuyến mãi mới nhất.';
        }
      } catch (error) {
        console.error('Error fetching coupons:', error);
        additionalContext = '\n\nCó lỗi xảy ra khi lấy thông tin mã giảm giá. Vui lòng thử lại sau.';
      }
    } else if (isSearchQuery) {
      try {
        console.log('🔍 Searching courses for query:', message);
        // Extract search terms and category from message
        const searchResults = await searchCourses(message);
        console.log(`📚 Found ${searchResults.length} courses`);

        if (searchResults.length > 0) {
          const validResults = searchResults.filter(course => course.slug && course.category?._id);

          if (validResults.length > 0) {
            // Prepare course data for visual display
            const courseDataForDisplay = validResults.map(course => ({
              _id: course._id,
              title: course.title,
              slug: course.slug,
              thumbnail: course.thumbnail,
              price: course.price,
              level: course.level,
              rating: course.rating,
              totalRatings: course.totalRatings,
              enrolledStudents: course.enrolledStudents,
              duration: course.duration,
              instructor: {
                name: course.instructor.name
              },
              category: {
                name: course.category.name,
                _id: course.category._id
              }
            }));

            console.log('🎨 Course data for display:', courseDataForDisplay);

            console.log('📚 Course data for display:', courseDataForDisplay);

            additionalContext = `

KẾT QUẢ TÌM KIẾM KHÓA HỌC:
| Tên khóa học | Cấp độ | Giá | Giảng viên |
|---|---|---|---|
${validResults.map(course =>
  `| ${course.title} | ${course.level} | ${course.price.toLocaleString('vi-VN')}đ | ${course.instructor.name} |`
).join('\n')}

CHI TIẾT KHÓA HỌC:
${validResults.map((course, index) =>
  `${index + 1}. ${course.title}
   Danh mục: ${course.category.name}
   Rating: ${course.rating}/5 (${course.totalRatings} đánh giá)
   Học viên: ${course.enrolledStudents} người
   Link khóa học: http://localhost:3000/courses/${course.slug}
   Link danh mục: http://localhost:3000/categories/${course.category._id}`
).join('\n\n')}

COURSE_DATA: ${JSON.stringify(courseDataForDisplay)}`;
          } else {
            additionalContext = '\n\nKhông tìm thấy khóa học phù hợp với yêu cầu. Hãy thử tìm kiếm với từ khóa khác hoặc xem tất cả khóa học tại: http://localhost:3000/courses';
          }
        } else {
          // Fallback: Show top courses if no search results
          const dbContext = await getChatDatabaseContext();
          const fallbackCourses = dbContext.courses
            .filter(course => course.slug && course.thumbnail)
            .slice(0, 4)
            .map(course => ({
              _id: course._id,
              title: course.title,
              slug: course.slug,
              thumbnail: course.thumbnail,
              price: course.price,
              level: course.level,
              rating: course.rating,
              totalRatings: course.totalRatings,
              enrolledStudents: course.enrolledStudents,
              duration: course.duration,
              instructor: {
                name: course.instructor.name
              },
              category: {
                name: course.category.name,
                _id: course.category._id
              }
            }));

          additionalContext = `\n\nKhông tìm thấy khóa học phù hợp với từ khóa "${message}". Dưới đây là một số khóa học nổi bật bạn có thể quan tâm:

KHÓA HỌC GỢI Ý:
| Tên khóa học | Cấp độ | Giá | Giảng viên |
|---|---|---|---|
${fallbackCourses.map(course =>
  `| ${course.title} | ${course.level} | ${course.price.toLocaleString('vi-VN')}đ | ${course.instructor.name} |`
).join('\n')}

COURSE_DATA: ${JSON.stringify(fallbackCourses)}`;
        }
      } catch (error) {
        console.error('Error searching courses:', error);
        additionalContext = '\n\nCó lỗi xảy ra khi tìm kiếm khóa học. Vui lòng thử lại sau.';
      }
    }

    // Build conversation context
    const conversationContext = conversationHistory
      .map((msg: any) => `${msg.role === 'user' ? 'Người dùng' : 'Trợ lý'}: ${msg.content}`)
      .join('\n');

    const fullPrompt = `${systemContext}${additionalContext}

LỊCH SỬ HỘI THOẠI:
${conversationContext}

CÂU HỎI MỚI:
Người dùng: ${message}

Trợ lý:`;

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from Gemini API');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    console.log('🤖 AI Response contains COURSE_DATA:', aiResponse.includes('COURSE_DATA:'));
    console.log('🤖 AI Response contains TOP_COURSES_DATA:', aiResponse.includes('TOP_COURSES_DATA:'));
    console.log('🤖 AI Response length:', aiResponse.length);

    return NextResponse.json({
      success: true,
      response: aiResponse.trim(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Fallback response
    const fallbackResponses = [
      'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ support@khoahoc.com để được hỗ trợ trực tiếp.',
      'Hệ thống đang bận, vui lòng thử lại sau ít phút. Nếu cần hỗ trợ gấp, hãy gọi hotline: 1900-1234.',
      'Tôi không thể trả lời ngay lúc này. Bạn có thể tìm thông tin trong phần FAQ hoặc liên hệ team support.'
    ];

    const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    return NextResponse.json({
      success: true,
      response: randomFallback,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
}
