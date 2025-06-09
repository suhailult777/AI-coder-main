import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, 'users.json');

export class UserStorage {
  constructor() {
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      await fs.access(USERS_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await this.saveUsers([]);
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
    const users = await this.loadUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  async getUserById(id) {
    const users = await this.loadUsers();
    return users.find(user => user.id === id);
  }

  async updateUser(id, updateData) {
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
    const users = await this.loadUsers();
    const filteredUsers = users.filter(user => user.id !== id);
    
    if (filteredUsers.length === users.length) {
      throw new Error('User not found');
    }

    await this.saveUsers(filteredUsers);
    return true;
  }

  async getAllUsers() {
    return await this.loadUsers();
  }

  async getUserCount() {
    const users = await this.loadUsers();
    return users.length;
  }
}
