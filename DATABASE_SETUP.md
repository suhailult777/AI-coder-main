# Database Setup Guide: Neon PostgreSQL

This guide walks you through setting up Neon PostgreSQL for your AI-Coder authentication system.

## 🚀 Quick Start

### 1. Create Neon Account

1. Go to [Neon Console](https://console.neon.tech/)
2. Sign up for a free account
3. Create a new project

### 2. Get Database Connection String

1. In your Neon dashboard, go to **Connection Details**
2. Copy the connection string (it looks like this):
   ```
   postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 3. Configure Environment

1. Update your `.env` file:
   ```env
   # Enable database usage
   USE_DATABASE=true
   
   # Add your Neon connection string
   DATABASE_URL=postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Test Connection

```bash
npm run dev
```

Check the console output - you should see:
```
✅ Connected to Neon PostgreSQL database
✅ Database schema initialized
🗄️  Using PostgreSQL database for user storage
🗄️  Using PostgreSQL for session storage
```

## 📊 Migration from JSON

If you have existing users in JSON format, migrate them:

### Option 1: Dry Run (Recommended First)
```bash
npm run migrate:dry-run
```

### Option 2: Migrate with Backup
```bash
npm run migrate:backup
```

### Option 3: Direct Migration
```bash
npm run migrate
```

## 🗄️ Database Schema

The system automatically creates these tables:

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  name VARCHAR(255),
  provider VARCHAR(50) DEFAULT 'local',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Session Table (Auto-created)
```sql
CREATE TABLE session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
```

### Indexes
- `idx_users_email` on `users(email)`
- `idx_users_provider` on `users(provider)`
- `idx_users_created_at` on `users(created_at)`

## 🔧 Configuration Options

### Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require

# Optional
USE_DATABASE=true                    # Enable/disable database usage
NODE_ENV=production                  # Environment mode
SESSION_SECRET=your-secret-key       # Session encryption key
```

### Fallback Behavior

The system gracefully falls back to JSON storage if:
- `USE_DATABASE=false`
- `DATABASE_URL` is not set
- Database connection fails

## 🏥 Health Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": {
    "status": "connected",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "PostgreSQL 15.1",
    "pool": {
      "total": 1,
      "idle": 1,
      "waiting": 0
    }
  },
  "environment": "development"
}
```

### Database Statistics

The system provides user statistics:
- Total users
- Users by provider (local, Google, etc.)
- Recent user registrations

## 🔒 Security Considerations

### Connection Security
- Always use SSL in production (`sslmode=require`)
- Keep connection strings secure
- Use environment variables, never hardcode

### Password Security
- Passwords are hashed with bcryptjs (12 rounds)
- OAuth users don't have passwords stored
- Session data is encrypted

### Access Control
- Database user should have minimal required permissions
- Consider using connection pooling limits
- Monitor for unusual access patterns

## 🚀 Production Deployment

### Neon Production Setup

1. **Upgrade Plan**: Consider Neon Pro for production workloads
2. **Connection Limits**: Configure appropriate pool sizes
3. **Monitoring**: Set up Neon monitoring and alerts
4. **Backups**: Neon provides automatic backups

### Environment Configuration

```env
# Production settings
NODE_ENV=production
USE_DATABASE=true
DATABASE_URL=postgresql://prod-user:secure-pass@prod-host/prod-db?sslmode=require
SESSION_SECRET=super-secure-random-string-at-least-32-chars
```

### Performance Optimization

```javascript
// Connection pool settings (in database.js)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections
  connectionTimeoutMillis: 2000, // Connection timeout
});
```

## 🛠️ Troubleshooting

### Common Issues

#### Connection Refused
```
Error: connect ECONNREFUSED
```
**Solution**: Check DATABASE_URL and network connectivity

#### SSL Certificate Error
```
Error: self signed certificate
```
**Solution**: Add `?sslmode=require` to connection string

#### Permission Denied
```
Error: permission denied for table users
```
**Solution**: Check database user permissions

#### Pool Exhausted
```
Error: remaining connection slots are reserved
```
**Solution**: Increase connection pool size or check for connection leaks

### Debug Mode

Enable detailed logging:
```env
NODE_ENV=development
```

This shows:
- Database connection status
- Query execution times
- Pool statistics

### Manual Database Access

Connect directly to your Neon database:
```bash
psql "postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

Useful queries:
```sql
-- Check users
SELECT id, email, provider, created_at FROM users;

-- Check sessions
SELECT sid, expire FROM session;

-- User statistics
SELECT provider, COUNT(*) FROM users GROUP BY provider;
```

## 📈 Monitoring & Maintenance

### Regular Tasks

1. **Monitor Connection Pool**: Check for connection leaks
2. **Review User Growth**: Track registration patterns
3. **Session Cleanup**: Old sessions are auto-cleaned
4. **Database Size**: Monitor storage usage in Neon console

### Backup Strategy

Neon provides:
- Automatic daily backups
- Point-in-time recovery
- Branch-based development

### Scaling Considerations

- **Read Replicas**: For high-read workloads
- **Connection Pooling**: Use PgBouncer for many connections
- **Caching**: Consider Redis for session storage at scale

## 🔄 Migration Back to JSON

If needed, you can migrate back to JSON:

1. Set `USE_DATABASE=false` in `.env`
2. Export users from database:
   ```sql
   COPY (SELECT row_to_json(users) FROM users) TO '/tmp/users.json';
   ```
3. Restart application

## 📞 Support

- **Neon Documentation**: [docs.neon.tech](https://docs.neon.tech)
- **PostgreSQL Docs**: [postgresql.org/docs](https://postgresql.org/docs)
- **Node.js pg Library**: [node-postgres.com](https://node-postgres.com)

## ✅ Verification Checklist

After setup, verify:

- [ ] Database connection successful
- [ ] Users table created
- [ ] Session table created
- [ ] Health check returns database status
- [ ] User registration works
- [ ] User login works
- [ ] Sessions persist across restarts
- [ ] Migration completed (if applicable)
