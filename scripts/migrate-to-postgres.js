#!/usr/bin/env node

/**
 * Migration Script: JSON to PostgreSQL
 * 
 * This script migrates user data from JSON file storage to PostgreSQL database.
 * 
 * Usage:
 *   node scripts/migrate-to-postgres.js [options]
 * 
 * Options:
 *   --dry-run    Show what would be migrated without actually doing it
 *   --force      Skip confirmation prompts
 *   --backup     Create a backup of the JSON file before migration
 */

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import database from '../server/database.js';
import { PostgreSQLUserStorage } from '../server/storage-postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, '..', 'server', 'users.json');
const BACKUP_FILE = path.join(__dirname, '..', 'server', `users.backup.${Date.now()}.json`);

class MigrationTool {
  constructor() {
    this.dryRun = process.argv.includes('--dry-run');
    this.force = process.argv.includes('--force');
    this.backup = process.argv.includes('--backup');
    this.postgresStorage = null;
  }

  async run() {
    try {
      console.log('🚀 Starting migration from JSON to PostgreSQL...\n');

      // Check if JSON file exists
      const jsonExists = await this.checkJsonFile();
      if (!jsonExists) {
        console.log('✅ No JSON file found - nothing to migrate');
        return;
      }

      // Connect to database
      await this.connectDatabase();

      // Load existing data
      const users = await this.loadJsonUsers();
      
      if (users.length === 0) {
        console.log('✅ No users found in JSON file - nothing to migrate');
        return;
      }

      console.log(`📊 Found ${users.length} users to migrate`);

      // Check for existing users in database
      await this.checkExistingUsers();

      // Show migration plan
      await this.showMigrationPlan(users);

      // Confirm migration (unless forced)
      if (!this.force && !this.dryRun) {
        const confirmed = await this.confirmMigration();
        if (!confirmed) {
          console.log('❌ Migration cancelled');
          return;
        }
      }

      // Create backup if requested
      if (this.backup && !this.dryRun) {
        await this.createBackup();
      }

      // Perform migration
      await this.migrateUsers(users);

      console.log('\n✅ Migration completed successfully!');
      
      if (!this.dryRun) {
        console.log('\n📝 Next steps:');
        console.log('1. Update your .env file to set USE_DATABASE=true');
        console.log('2. Test your application to ensure everything works');
        console.log('3. Consider removing the JSON file after verification');
      }

    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      process.exit(1);
    } finally {
      await database.close();
    }
  }

  async checkJsonFile() {
    try {
      await fs.access(USERS_FILE);
      return true;
    } catch (error) {
      return false;
    }
  }

  async connectDatabase() {
    console.log('🔌 Connecting to PostgreSQL database...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    const connected = await database.connect();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    this.postgresStorage = new PostgreSQLUserStorage();
    console.log('✅ Connected to database\n');
  }

  async loadJsonUsers() {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to read JSON file: ${error.message}`);
    }
  }

  async checkExistingUsers() {
    const existingCount = await this.postgresStorage.getUserCount();
    if (existingCount > 0) {
      console.log(`⚠️  Warning: Database already contains ${existingCount} users`);
      console.log('   Migration will skip users with existing email addresses\n');
    }
  }

  async showMigrationPlan(users) {
    console.log('📋 Migration Plan:');
    console.log(`   Source: ${USERS_FILE}`);
    console.log(`   Target: PostgreSQL database`);
    console.log(`   Users to migrate: ${users.length}`);
    
    if (this.dryRun) {
      console.log('   Mode: DRY RUN (no changes will be made)');
    }
    
    if (this.backup) {
      console.log(`   Backup: ${BACKUP_FILE}`);
    }
    
    console.log('\n👥 Users to migrate:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.provider || 'local'})`);
    });
    console.log('');
  }

  async confirmMigration() {
    return new Promise((resolve) => {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('Do you want to proceed with the migration? (y/N): ', (answer) => {
        readline.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  async createBackup() {
    console.log('💾 Creating backup...');
    try {
      await fs.copyFile(USERS_FILE, BACKUP_FILE);
      console.log(`✅ Backup created: ${BACKUP_FILE}\n`);
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  async migrateUsers(users) {
    console.log('🔄 Starting user migration...\n');
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        if (this.dryRun) {
          console.log(`   [DRY RUN] Would migrate: ${user.email}`);
          migrated++;
        } else {
          // Check if user already exists
          const existing = await this.postgresStorage.getUserByEmail(user.email);
          if (existing) {
            console.log(`   ⏭️  Skipped (exists): ${user.email}`);
            skipped++;
            continue;
          }

          // Migrate user
          await this.postgresStorage.createUser({
            email: user.email,
            password: user.password,
            name: user.name,
            provider: user.provider || 'local'
          });

          console.log(`   ✅ Migrated: ${user.email}`);
          migrated++;
        }
      } catch (error) {
        console.log(`   ❌ Error migrating ${user.email}: ${error.message}`);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migration = new MigrationTool();
  migration.run();
}

export default MigrationTool;
