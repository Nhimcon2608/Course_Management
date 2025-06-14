import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Course from '../models/Course';

async function testVideoDisplay() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get React.js course specifically
    const reactCourse = await Course.findOne({ 
      title: { $regex: /react/i } 
    }).select('title slug lessons');

    if (!reactCourse) {
      console.log('❌ React.js course not found');
      return;
    }

    console.log('\n🎯 TESTING VIDEO DISPLAY FOR REACT.JS COURSE');
    console.log('=' .repeat(80));
    console.log(`📖 Course: "${reactCourse.title}"`);
    console.log(`🔗 Course ID: ${reactCourse._id}`);
    console.log(`📝 Slug: ${reactCourse.slug}`);
    console.log(`📚 Total lessons: ${reactCourse.lessons?.length || 0}`);

    if (!reactCourse.lessons || reactCourse.lessons.length === 0) {
      console.log('❌ No lessons found in React.js course');
      return;
    }

    console.log('\n🎥 VIDEO URL TESTING:');
    console.log('-'.repeat(80));

    // Test first 6 lessons (should have YouTube URLs)
    for (let i = 0; i < Math.min(6, reactCourse.lessons.length); i++) {
      const lesson = reactCourse.lessons[i];
      const isYouTube = lesson.videoUrl?.includes('youtu');
      const status = isYouTube ? '✅ YouTube' : '❌ Not YouTube';
      
      console.log(`\n${i + 1}. ${lesson.title}`);
      console.log(`   Order: ${lesson.order}`);
      console.log(`   Duration: ${lesson.duration} minutes`);
      console.log(`   Preview: ${lesson.isPreview ? 'Yes' : 'No'}`);
      console.log(`   Video Status: ${status}`);
      console.log(`   URL: ${lesson.videoUrl}`);
      
      if (isYouTube && lesson.videoUrl) {
        // Extract video ID for testing
        const videoIdMatch = lesson.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/);
        if (videoIdMatch) {
          console.log(`   Video ID: ${videoIdMatch[1]}`);
          console.log(`   Embed URL: https://www.youtube.com/embed/${videoIdMatch[1]}`);
        }
      }
    }

    console.log('\n🌐 FRONTEND TESTING URLS:');
    console.log('-'.repeat(80));
    console.log(`🔗 Learning Page: http://localhost:3000/courses/${reactCourse._id}/learn`);
    console.log(`🔗 Course Detail: http://localhost:3000/courses/${reactCourse._id}`);
    console.log(`🔗 Course by Slug: http://localhost:3000/courses/${reactCourse.slug}`);

    console.log('\n📋 EXPECTED BEHAVIOR:');
    console.log('-'.repeat(80));
    console.log('✅ First lesson should auto-load when page opens');
    console.log('✅ YouTube videos should display in iframe player');
    console.log('✅ Sample videos (lessons 7-10) should show in HTML5 video player');
    console.log('✅ Video player should be responsive and fill the container');
    console.log('✅ Loading states should show while video loads');
    console.log('✅ Error states should show for invalid URLs');

    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('-'.repeat(80));
    console.log('1. Check browser console for JavaScript errors');
    console.log('2. Verify VideoPlayer component is imported correctly');
    console.log('3. Check if YouTube URLs are accessible');
    console.log('4. Ensure iframe permissions are set correctly');
    console.log('5. Test with different browsers (Chrome, Firefox, Safari)');

    // Test Digital Marketing course too
    const marketingCourse = await Course.findOne({ 
      title: { $regex: /digital marketing/i } 
    }).select('title slug lessons');

    if (marketingCourse) {
      console.log('\n🎯 DIGITAL MARKETING COURSE SUMMARY:');
      console.log('-'.repeat(80));
      console.log(`📖 Course: "${marketingCourse.title}"`);
      console.log(`🔗 Course ID: ${marketingCourse._id}`);
      console.log(`🔗 Learning Page: http://localhost:3000/courses/${marketingCourse._id}/learn`);
      
      const youtubeCount = marketingCourse.lessons?.filter(l => l.videoUrl?.includes('youtu')).length || 0;
      console.log(`🎥 YouTube videos: ${youtubeCount}/${marketingCourse.lessons?.length || 0}`);
    }

    console.log('\n🎉 VIDEO TESTING INFORMATION COMPLETE!');
    console.log('=' .repeat(80));
    console.log('Now test the learning pages in your browser to verify video display.');

  } catch (error) {
    console.error('❌ Error testing video display:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testVideoDisplay();
}

export default testVideoDisplay;
