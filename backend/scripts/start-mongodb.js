const { spawn } = require('child_process');
const path = require('path');

// Function to start MongoDB locally
function startMongoDB() {
  console.log('🔄 Starting MongoDB...');
  
  // Try to start MongoDB service on Windows
  const mongod = spawn('mongod', ['--dbpath', './data/db'], {
    stdio: 'inherit',
    shell: true
  });

  mongod.on('error', (err) => {
    console.error('❌ Failed to start MongoDB locally:', err.message);
    console.log('💡 Please ensure MongoDB is installed or use MongoDB Atlas');
    console.log('💡 You can also start MongoDB manually with: mongod --dbpath ./data/db');
    process.exit(1);
  });

  mongod.on('close', (code) => {
    console.log(`MongoDB process exited with code ${code}`);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🔄 Shutting down MongoDB...');
    mongod.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🔄 Shutting down MongoDB...');
    mongod.kill('SIGTERM');
    process.exit(0);
  });
}

// Check if MongoDB is already running
const { exec } = require('child_process');

exec('mongod --version', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ MongoDB is not installed or not in PATH');
    console.log('💡 Please install MongoDB or use MongoDB Atlas');
    console.log('💡 For development, you can use MongoDB Atlas (cloud) by updating the MONGODB_URI in .env');
    process.exit(1);
  } else {
    console.log('✅ MongoDB found:', stdout.split('\n')[0]);
    startMongoDB();
  }
});
