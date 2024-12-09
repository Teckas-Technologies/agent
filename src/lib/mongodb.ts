import mongoose from 'mongoose';
import { MONGODB_URI } from '@/config/constants';

const options = {
  ssl: true,
};

class Database {
  private static instance: Database;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await mongoose.connect(MONGODB_URI, options);
        console.log('Connected to MongoDB with Mongoose');
        this.isConnected = true;
      } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
      }
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

const database = Database.getInstance();
export const connectToDatabase = database.connect.bind(database);
export const getConnectionStatus = database.getConnectionStatus.bind(database);
