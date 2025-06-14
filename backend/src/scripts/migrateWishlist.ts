import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Wishlist from '../models/Wishlist';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';

async function migrateWishlistData() {
  try {
    console.log('🔄 Starting wishlist migration...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users with wishlist data
    const usersWithWishlist = await User.find({
      wishlist: { $exists: true, $ne: [] }
    }).select('_id wishlist');

    console.log(`📊 Found ${usersWithWishlist.length} users with wishlist data`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const user of usersWithWishlist) {
      try {
        // Check if wishlist already exists for this user
        const existingWishlist = await Wishlist.findOne({ user: user._id });
        
        if (existingWishlist) {
          console.log(`⚠️ Wishlist already exists for user ${user._id}, skipping...`);
          continue;
        }

        // Create new wishlist document
        const newWishlist = new Wishlist({
          user: user._id,
          courses: user.wishlist || []
        });

        await newWishlist.save();
        migratedCount++;
        
        console.log(`✅ Migrated wishlist for user ${user._id} with ${user.wishlist?.length || 0} courses`);
      } catch (error) {
        console.error(`❌ Error migrating wishlist for user ${user._id}:`, error);
        errorCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} wishlists`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${usersWithWishlist.length} users`);

    // Verify migration
    const totalWishlists = await Wishlist.countDocuments();
    console.log(`🔍 Total wishlists in new collection: ${totalWishlists}`);

    // Optional: Remove wishlist field from User model after successful migration
    // Uncomment the following lines if you want to clean up the User model
    /*
    console.log('\n🧹 Cleaning up User model...');
    const updateResult = await User.updateMany(
      { wishlist: { $exists: true } },
      { $unset: { wishlist: 1 } }
    );
    console.log(`✅ Removed wishlist field from ${updateResult.modifiedCount} users`);
    */

    console.log('\n🎉 Wishlist migration completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateWishlistData()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export default migrateWishlistData;
