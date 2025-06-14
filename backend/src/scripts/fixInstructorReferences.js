const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';

async function fixInstructorReferences() {
  try {
    console.log('🔧 Fixing instructor references in courses...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get collections
    const db = mongoose.connection.db;
    const coursesCollection = db.collection('courses');
    const usersCollection = db.collection('users');

    // 1. Find courses with null or invalid instructor references
    console.log('\n🔍 Checking courses with instructor issues...');
    
    const coursesWithNullInstructor = await coursesCollection.find({
      $or: [
        { instructor: null },
        { instructor: { $exists: false } },
        { instructor: '' }
      ]
    }).toArray();

    console.log(`Found ${coursesWithNullInstructor.length} courses with null/missing instructor`);

    // 2. Find courses with invalid instructor ObjectIds
    const allCourses = await coursesCollection.find({}).toArray();
    const coursesWithInvalidInstructor = [];

    for (const course of allCourses) {
      if (course.instructor && mongoose.Types.ObjectId.isValid(course.instructor)) {
        // Check if instructor exists
        const instructorExists = await usersCollection.findOne({
          _id: new mongoose.Types.ObjectId(course.instructor),
          role: 'instructor'
        });
        
        if (!instructorExists) {
          coursesWithInvalidInstructor.push(course);
        }
      }
    }

    console.log(`Found ${coursesWithInvalidInstructor.length} courses with invalid instructor references`);

    // 3. Get a valid instructor to use as default
    console.log('\n🔍 Finding valid instructors...');
    const validInstructors = await usersCollection.find({
      role: 'instructor',
      isActive: true
    }).toArray();

    console.log(`Found ${validInstructors.length} valid instructors`);

    if (validInstructors.length === 0) {
      console.log('❌ No valid instructors found. Creating a default instructor...');
      
      // Create a default instructor
      const defaultInstructor = {
        name: 'Default Instructor',
        email: 'default.instructor@example.com',
        password: '$2a$12$defaulthashedpassword', // This should be properly hashed
        role: 'instructor',
        isActive: true,
        isEmailVerified: true,
        bio: 'Default instructor for courses without assigned instructors',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insertResult = await usersCollection.insertOne(defaultInstructor);
      validInstructors.push({ _id: insertResult.insertedId, ...defaultInstructor });
      console.log('✅ Created default instructor');
    }

    const defaultInstructorId = validInstructors[0]._id;
    console.log(`Using instructor: ${validInstructors[0].name} (${defaultInstructorId})`);

    // 4. Fix courses with null/missing instructors
    if (coursesWithNullInstructor.length > 0) {
      console.log('\n🔄 Fixing courses with null/missing instructors...');
      
      const updateResult = await coursesCollection.updateMany(
        {
          $or: [
            { instructor: null },
            { instructor: { $exists: false } },
            { instructor: '' }
          ]
        },
        {
          $set: { 
            instructor: defaultInstructorId,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ Updated ${updateResult.modifiedCount} courses with null instructors`);
    }

    // 5. Fix courses with invalid instructor references
    if (coursesWithInvalidInstructor.length > 0) {
      console.log('\n🔄 Fixing courses with invalid instructor references...');
      
      for (const course of coursesWithInvalidInstructor) {
        await coursesCollection.updateOne(
          { _id: course._id },
          {
            $set: { 
              instructor: defaultInstructorId,
              updatedAt: new Date()
            }
          }
        );
      }

      console.log(`✅ Updated ${coursesWithInvalidInstructor.length} courses with invalid instructor references`);
    }

    // 6. Verify the fix
    console.log('\n✅ Verification...');
    const remainingIssues = await coursesCollection.find({
      $or: [
        { instructor: null },
        { instructor: { $exists: false } },
        { instructor: '' }
      ]
    }).count();

    console.log(`Remaining courses with instructor issues: ${remainingIssues}`);

    if (remainingIssues === 0) {
      console.log('🎉 All instructor references fixed successfully!');
    } else {
      console.log('⚠️ Some issues remain. Manual review may be needed.');
    }

    console.log('\n📊 Final instructor distribution:');
    const instructorStats = await coursesCollection.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'instructor',
          foreignField: '_id',
          as: 'instructorInfo'
        }
      },
      {
        $group: {
          _id: '$instructor',
          count: { $sum: 1 },
          instructorName: { $first: { $arrayElemAt: ['$instructorInfo.name', 0] } }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();

    instructorStats.forEach(stat => {
      console.log(`- ${stat.instructorName || 'Unknown'}: ${stat.count} courses`);
    });

  } catch (error) {
    console.error('❌ Error fixing instructor references:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

fixInstructorReferences();
