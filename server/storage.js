import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import database from './database.js';
import { PostgreSQLUserStorage } from './storage-postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, 'users.json');

export class UserStorage {
  constructor() {
    this.postgresStorage = null;
    this.useDatabase = false;
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      // Try to connect to PostgreSQL database
      const connected = await database.connect();

      if (connected) {
        this.postgresStorage = new PostgreSQLUserStorage();
        this.useDatabase = true;
        console.log('🗄️  Using PostgreSQL database for user storage');
      } else {
        // Fall back to JSON file storage
        this.useDatabase = false;
        console.log('📁 Using JSON file storage for users');

        try {
          await fs.access(USERS_FILE);
        } catch (error) {
          // File doesn't exist, create it
          await this.saveUsers([]);
        }
      }
    } catch (error) {
      console.error('Storage initialization error:', error.message);
      // Fall back to JSON storage
      this.useDatabase = false;
      try {
        await fs.access(USERS_FILE);
      } catch (fileError) {
        await this.saveUsers([]);
      }
    }
  }

  async loadUsers() {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  async saveUsers(users) {
    try {
      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
      throw new Error('Failed to save user data');
    }
  }

  async createUser(userData) {
    if (this.useDatabase && this.postgresStorage) {
      return await this.postgresStorage.createUser(userData);
    }

    // JSON file fallback
    const users = await this.loadUsers();

    const newUser = {
      id: uuidv4(),
      ...userData,
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    await this.saveUsers(users);

    return newUser;
  }

  async getUserByEmail(email) {
    if (this.useDatabase && this.postgresStorage) {
      return await this.postgresStorage.getUserByEmail(email);
    }

    // JSON file fallback
    const users = await this.loadUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  async getUserById(id) {
    if (this.useDatabase && this.postgresStorage) {
      return await this.postgresStorage.getUserById(id);
    }

    // JSON file fallback
    const users = await this.loadUsers();
    return users.find(user => user.id === id);
  }

  async updateUser(id, updateData) {
    if (this.useDatabase && this.postgresStorage) {
      return await this.postgresStorage.updateUser(id, updateData);
    }

    // JSON file fallback
    const users = await this.loadUsers();
    const userIndex = users.findIndex(user => user.id === id);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await this.saveUsers(users);
    return users[userIndex];
  }

  async deleteUser(id) {
    if (this.useDatabase && this.postgresStorage) {
      return await this.postgresStorage.deleteUser(id);
    }

    // JSON file fallback
    const users = await this.loadUsers();
    const filteredUsers = users.filter(user => user.id !== id);

    if (filteredUsers.length === users.length) {
      throw new Error('User not found');
    }

    await this.saveUsers(filteredUsers);
    return true;
  }

  async getAllUsers() {
    if (this.useDatabase && this.postgresStorage) {
      return await this.postgresStorage.getAllUsers();
    }

    // JSON file fallback
    return await this.loadUsers();
  }

  async getUserCount() {
    if (this.useDatabase && this.postgresStorage) {
      return await this.postgresStorage.getUserCount();
    }

    // JSON file fallback
    const users = await this.loadUsers();
    return users.length;
  }

  // Additional methods for PostgreSQL
  async getUserStats() {
    if (this.useDatabase && this.postgresStorage) {
      return await this.postgresStorage.getUserStats();
    }

    // JSON file fallback - basic stats
    const users = await this.loadUsers();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total_users: users.length,
      local_users: users.filter(u => u.provider === 'local').length,
      google_users: users.filter(u => u.provider === 'google').length,
      firebase_google_users: users.filter(u => u.provider === 'firebase-google').length,
      users_last_week: users.filter(u => new Date(u.createdAt) >= weekAgo).length,
      users_last_month: users.filter(u => new Date(u.createdAt) >= monthAgo).length
    };
  }

  async healthCheck() {
    if (this.useDatabase && this.postgresStorage) {
      return await this.postgresStorage.healthCheck();
    }

    // JSON file fallback
    try {
      const users = await this.loadUsers();
      return {
        status: 'healthy',
        storage: 'json',
        userCount: users.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        storage: 'json',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
