import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quan-ly-khoa-hoc';
const MONGODB_DB = process.env.MONGODB_DB || 'quan-ly-khoa-hoc';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (cachedClient && cachedDb) {
    return cachedDb;
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db(MONGODB_DB);

    cachedClient = client;
    cachedDb = db;

    console.log('✅ Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}