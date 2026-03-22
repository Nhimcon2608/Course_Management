import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Instructor from '../models/Instructor';
import User from '../models/User';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const sampleInstructors = [
  {
    name: 'Dr. Sarah Chen',
    title: 'Senior Software Engineer at Google',
    bio: 'Former tech lead at Google with expertise in building scalable web applications. Passionate about teaching modern web development practices and helping students transition into tech careers.',
    expertise: ['React', 'Node.js', 'TypeScript', 'System Design', 'JavaScript'],
    rating: 4.9,
    studentsCount: 15420,
    coursesCount: 8,
    experience: '12+ years',
    achievements: [
      'Led development of Google Search features',
      'Published 15+ technical articles',
      'Speaker at React Conf 2023',
      'Mentor to 100+ developers'
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/sarahchen',
      twitter: 'https://twitter.com/sarahchen',
      website: 'https://sarahchen.dev'
    },
    company: 'Google',
    location: 'San Francisco, CA',
    languages: ['English', 'Mandarin'],
    featured: true,
    verified: true
  },
  {
    name: 'Marcus Johnson',
    title: 'Principal Data Scientist at Netflix',
    bio: 'Data science expert who has built recommendation systems used by millions. Specializes in practical machine learning applications and helping students understand complex algorithms.',
    expertise: ['Python', 'Machine Learning', 'Deep Learning', 'MLOps', 'TensorFlow'],
    rating: 4.8,
    studentsCount: 12350,
    coursesCount: 6,
    experience: '10+ years',
    achievements: [
      'Built Netflix recommendation engine',
      'PhD in Computer Science from MIT',
      'Published 20+ research papers',
      'Kaggle Grandmaster'
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/marcusjohnson',
      website: 'https://marcusml.com'
    },
    company: 'Netflix',
    location: 'Los Angeles, CA',
    languages: ['English'],
    featured: true,
    verified: true
  },
  {
    name: 'Emily Rodriguez',
    title: 'Head of Design at Airbnb',
    bio: 'Award-winning designer who has shaped user experiences for millions of travelers. Expert in design thinking and user-centered design methodologies.',
    expertise: ['UX Design', 'Design Systems', 'Figma', 'User Research', 'Prototyping'],
    rating: 4.9,
    studentsCount: 9870,
    coursesCount: 5,
    experience: '8+ years',
    achievements: [
      'Redesigned Airbnb mobile app',
      'Winner of UX Design Awards 2022',
      'Featured in Design Weekly',
      'Mentor at Design+Research'
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/emilyrodriguez',
      twitter: 'https://twitter.com/emilyux'
    },
    company: 'Airbnb',
    location: 'San Francisco, CA',
    languages: ['English', 'Spanish'],
    featured: true,
    verified: true
  },
  {
    name: 'David Kim',
    title: 'DevOps Engineer at Amazon',
    bio: 'Cloud infrastructure expert who has scaled systems to handle millions of requests. Passionate about DevOps best practices and cloud architecture.',
    expertise: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
    rating: 4.7,
    studentsCount: 8540,
    coursesCount: 4,
    experience: '9+ years',
    achievements: [
      'Architected AWS solutions for Fortune 500',
      'AWS Certified Solutions Architect',
      'Speaker at DevOps conferences',
      'Open source contributor'
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/davidkim',
      website: 'https://davidkim.cloud'
    },
    company: 'Amazon',
    location: 'Seattle, WA',
    languages: ['English', 'Korean'],
    verified: true
  },
  {
    name: 'Lisa Thompson',
    title: 'Product Manager at Microsoft',
    bio: 'Experienced product manager with a track record of launching successful products. Specializes in product strategy, user research, and agile methodologies.',
    expertise: ['Product Management', 'Agile', 'User Research', 'Analytics', 'Strategy'],
    rating: 4.6,
    studentsCount: 7200,
    coursesCount: 3,
    experience: '7+ years',
    achievements: [
      'Launched Microsoft Teams features',
      'MBA from Stanford',
      'Product Management certified',
      'Mentored 50+ PMs'
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/lisathompson'
    },
    company: 'Microsoft',
    location: 'Redmond, WA',
    languages: ['English'],
    verified: true
  },
  {
    name: 'Ahmed Hassan',
    title: 'Mobile Developer at Uber',
    bio: 'Mobile development expert with experience in both iOS and Android platforms. Passionate about creating smooth user experiences and performance optimization.',
    expertise: ['iOS', 'Android', 'React Native', 'Swift', 'Kotlin'],
    rating: 4.8,
    studentsCount: 6800,
    coursesCount: 7,
    experience: '6+ years',
    achievements: [
      'Built Uber driver app features',
      'iOS and Android certified',
      'Mobile conference speaker',
      'App Store featured apps'
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/ahmedhassan',
      github: 'https://github.com/ahmedhassan'
    },
    company: 'Uber',
    location: 'San Francisco, CA',
    languages: ['English', 'Arabic'],
    verified: true
  },
  {
    name: 'Jennifer Wu',
    title: 'Cybersecurity Specialist at Tesla',
    bio: 'Cybersecurity expert with focus on automotive security and IoT protection. Helps organizations build secure systems and educates about security best practices.',
    expertise: ['Cybersecurity', 'Penetration Testing', 'Network Security', 'IoT Security'],
    rating: 4.7,
    studentsCount: 5400,
    coursesCount: 4,
    experience: '8+ years',
    achievements: [
      'Secured Tesla vehicle systems',
      'CISSP certified',
      'Security conference speaker',
      'Published security research'
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/jenniferwu'
    },
    company: 'Tesla',
    location: 'Austin, TX',
    languages: ['English', 'Mandarin'],
    verified: true
  },
  {
    name: 'Carlos Mendoza',
    title: 'Full Stack Developer at Spotify',
    bio: 'Full stack developer with expertise in modern web technologies. Passionate about music technology and building scalable applications that serve millions of users.',
    expertise: ['Full Stack', 'JavaScript', 'Python', 'GraphQL', 'Microservices'],
    rating: 4.5,
    studentsCount: 4900,
    coursesCount: 5,
    experience: '5+ years',
    achievements: [
      'Built Spotify playlist features',
      'Full stack bootcamp graduate',
      'Open source maintainer',
      'Tech meetup organizer'
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/carlosmendoza',
      github: 'https://github.com/carlosmendoza'
    },
    company: 'Spotify',
    location: 'New York, NY',
    languages: ['English', 'Spanish'],
    verified: true
  }
];

async function seedInstructors() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/course-management');
    console.log('Connected to MongoDB');

    // Clear existing instructors
    await Instructor.deleteMany({});
    console.log('Cleared existing instructors');

    // Create instructors
    for (const instructorData of sampleInstructors) {
      // Create a dummy user ID for each instructor
      const userId = new mongoose.Types.ObjectId().toString();
      
      const instructor = new Instructor({
        ...instructorData,
        userId,
        joinedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
        lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last month
        responseTime: 'Usually responds within 24 hours',
        availability: 'available',
        status: 'active'
      });

      await instructor.save();
      console.log(`Created instructor: ${instructor.name}`);
    }

    console.log('✅ Successfully seeded instructors');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding instructors:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedInstructors();
