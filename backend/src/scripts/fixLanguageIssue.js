const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';

async function fixLanguageIssue() {
  try {
    console.log('🔧 Fixing MongoDB language override issue...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the courses collection
    const db = mongoose.connection.db;
    const coursesCollection = db.collection('courses');

    // Check for existing text indexes
    console.log('\n🔍 Checking for text indexes...');
    const indexes = await coursesCollection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

    // Check if there are any text indexes
    const textIndexes = indexes.filter(idx => 
      Object.values(idx.key).some(value => value === 'text')
    );

    if (textIndexes.length > 0) {
      console.log('📝 Found text indexes:', textIndexes);
      
      // Drop text indexes that might be causing the issue
      for (const textIndex of textIndexes) {
        console.log(`🗑️ Dropping text index: ${textIndex.name}`);
        await coursesCollection.dropIndex(textIndex.name);
        console.log(`✅ Dropped text index: ${textIndex.name}`);
      }
    } else {
      console.log('✅ No text indexes found');
    }

    // Update any courses with 'vi' language to 'english'
    console.log('\n🔄 Updating courses with "vi" language to "english"...');
    const updateResult = await coursesCollection.updateMany(
      { language: 'vi' },
      { $set: { language: 'english' } }
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} courses`);

    // Check for any other problematic language values
    console.log('\n🔍 Checking for other language values...');
    const languageStats = await coursesCollection.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();

    console.log('Language distribution:', languageStats);

    // Update any non-standard language values
    const validLanguages = ['english', 'vietnamese', 'en', 'vi'];
    for (const stat of languageStats) {
      if (stat._id && !validLanguages.includes(stat._id)) {
        console.log(`🔄 Updating invalid language "${stat._id}" to "english"...`);
        await coursesCollection.updateMany(
          { language: stat._id },
          { $set: { language: 'english' } }
        );
        console.log(`✅ Updated ${stat.count} courses with language "${stat._id}"`);
      }
    }

    console.log('\n✅ Language issue fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing language issue:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

fixLanguageIssue();
