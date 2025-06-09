import database from './database.js';

export class PostgreSQLUserStorage {
  constructor() {
    this.db = database;
  }

  async createUser(userData) {
    try {
      const query = `
        INSERT INTO users (email, password, name, provider)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, provider, created_at, updated_at
      `;
      
      const values = [
        userData.email,
        userData.password || null,
        userData.name || null,
        userData.provider || 'local'
      ];

      const result = await this.db.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create user');
      }

      const user = result.rows[0];
      console.log(`✅ User created: ${user.email} (${user.provider})`);
      
      return {
        id: user.id,
        email: user.email,
        password: userData.password, // Include for auth flow
        name: user.name,
        provider: user.provider,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('User already exists with this email');
      }
      console.error('❌ Error creating user:', error.message);
      throw new Error('Failed to create user');
    }
  }

  async getUserByEmail(email) {
    try {
      const query = `
        SELECT id, email, password, name, provider, created_at, updated_at
        FROM users
        WHERE email = $1
      `;
      
      const result = await this.db.query(query, [email.toLowerCase()]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        password: user.password,
        name: user.name,
        provider: user.provider,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    } catch (error) {
      console.error('❌ Error getting user by email:', error.message);
      throw new Error('Failed to retrieve user');
    }
  }

  async getUserById(id) {
    try {
      const query = `
        SELECT id, email, password, name, provider, created_at, updated_at
        FROM users
        WHERE id = $1
      `;
      
      const result = await this.db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        password: user.password,
        name: user.name,
        provider: user.provider,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    } catch (error) {
      console.error('❌ Error getting user by ID:', error.message);
      throw new Error('Failed to retrieve user');
    }
  }

  async updateUser(id, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      // Build dynamic update query
      if (updateData.email !== undefined) {
        fields.push(`email = $${paramCount++}`);
        values.push(updateData.email.toLowerCase());
      }
      if (updateData.password !== undefined) {
        fields.push(`password = $${paramCount++}`);
        values.push(updateData.password);
      }
      if (updateData.name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        values.push(updateData.name);
      }
      if (updateData.provider !== undefined) {
        fields.push(`provider = $${paramCount++}`);
        values.push(updateData.provider);
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id); // Add ID as last parameter

      const query = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, email, name, provider, created_at, updated_at
      `;

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      console.log(`✅ User updated: ${user.email}`);
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Email already exists');
      }
      console.error('❌ Error updating user:', error.message);
      throw new Error('Failed to update user');
    }
  }

  async deleteUser(id) {
    try {
      const query = `
        DELETE FROM users
        WHERE id = $1
        RETURNING email
      `;
      
      const result = await this.db.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      console.log(`✅ User deleted: ${result.rows[0].email}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting user:', error.message);
      throw new Error('Failed to delete user');
    }
  }

  async getAllUsers() {
    try {
      const query = `
        SELECT id, email, name, provider, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
      `;
      
      const result = await this.db.query(query);
      
      return result.rows.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }));
    } catch (error) {
      console.error('❌ Error getting all users:', error.message);
      throw new Error('Failed to retrieve users');
    }
  }

  async getUserCount() {
    try {
      const query = 'SELECT COUNT(*) as count FROM users';
      const result = await this.db.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Error getting user count:', error.message);
      throw new Error('Failed to get user count');
    }
  }

  async getUserStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN provider = 'local' THEN 1 END) as local_users,
          COUNT(CASE WHEN provider = 'google' THEN 1 END) as google_users,
          COUNT(CASE WHEN provider = 'firebase-google' THEN 1 END) as firebase_google_users,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as users_last_week,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as users_last_month
        FROM users
      `;
      
      const result = await this.db.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error getting user stats:', error.message);
      throw new Error('Failed to get user statistics');
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const dbHealth = await this.db.healthCheck();
      const userCount = await this.getUserCount();
      
      return {
        status: 'healthy',
        database: dbHealth,
        userCount: userCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
