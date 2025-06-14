/* global use, db */
// MongoDB Playground - Course Management System Database Test
// Test kết nối và khởi tạo database cho Course Management System

// 🎯 Chuyển sang database của dự án Course Management System
use('quan-ly-khoa-hoc');

// 🧪 Test 1: Kiểm tra kết nối database
console.log('🔄 Testing Course Management System Database...');
console.log('📊 Database name:', db.getName());

// 🧪 Test 2: Liệt kê các collections hiện có
console.log('📁 Current collections:');
db.listCollectionNames().forEach(name => console.log(`   - ${name}`));

// 🧪 Test 3: Tạo test document để kiểm tra quyền write
const testResult = db.getCollection('connection_test').insertOne({
  message: 'Course Management System connection test',
  timestamp: new Date(),
  status: 'success'
});
console.log('✍️  Test write successful, ID:', testResult.insertedId);

// 🧪 Test 4: Đọc test document
const readResult = db.getCollection('connection_test').findOne({ _id: testResult.insertedId });
console.log('📖 Test read successful:', readResult.message);

// 🧪 Test 5: Xóa test document (cleanup)
db.getCollection('connection_test').deleteOne({ _id: testResult.insertedId });
console.log('🧹 Test cleanup completed');

// 🧪 Test 6: Kiểm tra các collections cần thiết cho Course Management System
const requiredCollections = [
  'users', 'courses', 'categories', 'orders', 'cart', 
  'wishlist', 'reviews', 'lessons', 'assignments', 
  'assignmentsubmissions', 'notifications', 'coupons'
];

console.log('\n📋 Checking required collections:');
const existingCollections = db.listCollectionNames();

requiredCollections.forEach(collectionName => {
  const exists = existingCollections.includes(collectionName);
  console.log(`   ${exists ? '✅' : '❌'} ${collectionName}: ${exists ? 'exists' : 'missing'}`);
});

// 🧪 Test 7: Nếu có dữ liệu, hiển thị thống kê cơ bản
console.log('\n📊 Database Statistics:');
if (existingCollections.includes('users')) {
  const userCount = db.users.countDocuments();
  console.log(`   👥 Users: ${userCount}`);
}
if (existingCollections.includes('courses')) {
  const courseCount = db.courses.countDocuments();
  console.log(`   📚 Courses: ${courseCount}`);
}
if (existingCollections.includes('categories')) {
  const categoryCount = db.categories.countDocuments();
  console.log(`   🏷️  Categories: ${categoryCount}`);
}

console.log('\n🎉 Database connection test completed successfully!');
