# Deployment Guide

This guide covers deploying the AI-Coder with Authentication to various platforms.

## 🚀 Production Deployment

### Prerequisites for Production

1. **Environment Variables**
   ```env
   NODE_ENV=production
   PORT=3000
   SESSION_SECRET=your-super-secure-random-string-at-least-32-characters
   
   # Firebase (for Google Auth)
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----"
   
   # OpenRouter API
   OPENROUTER_API_KEY=your-openrouter-api-key
   ```

2. **Security Considerations**
   - Use HTTPS in production
   - Set secure session cookies
   - Implement rate limiting
   - Use a proper database instead of JSON files
   - Set up proper CORS origins

### Platform-Specific Deployment

#### 1. Heroku Deployment

1. **Install Heroku CLI**
   ```bash
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Prepare for Heroku**
   ```bash
   # Add Procfile
   echo "web: node server/index.js" > Procfile
   
   # Update package.json
   # Add "start" script if not present
   ```

3. **Deploy**
   ```bash
   heroku create your-app-name
   heroku config:set NODE_ENV=production
   heroku config:set SESSION_SECRET=your-secure-secret
   # Add other environment variables
   git push heroku main
   ```

#### 2. Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Create vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/server/index.js"
       },
       {
         "src": "/(.*)",
         "dest": "/server/index.js"
       }
     ]
   }
   ```

3. **Deploy**
   ```bash
   vercel
   # Follow the prompts
   # Set environment variables in Vercel dashboard
   ```

#### 3. Railway Deployment

1. **Connect GitHub Repository**
   - Go to railway.app
   - Connect your GitHub repository
   - Set environment variables in Railway dashboard

2. **Configure**
   - Railway will auto-detect Node.js
   - Set start command: `node server/index.js`

#### 4. DigitalOcean App Platform

1. **Create App**
   - Connect GitHub repository
   - Choose Node.js environment

2. **Configure**
   ```yaml
   # .do/app.yaml
   name: ai-coder-auth
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/your-repo
       branch: main
     run_command: node server/index.js
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     - key: SESSION_SECRET
       value: your-secret
       type: SECRET
   ```

### Database Migration (Recommended for Production)

The current implementation uses JSON files for simplicity. For production, migrate to a proper database:

#### PostgreSQL Migration

1. **Install Dependencies**
   ```bash
   npm install pg
   ```

2. **Update storage.js**
   ```javascript
   import pg from 'pg';
   const { Pool } = pg;
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
   });
   
   // Replace file operations with SQL queries
   ```

3. **Create Tables**
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

#### MongoDB Migration

1. **Install Dependencies**
   ```bash
   npm install mongodb
   ```

2. **Update storage.js**
   ```javascript
   import { MongoClient } from 'mongodb';
   
   const client = new MongoClient(process.env.MONGODB_URI);
   // Implement MongoDB operations
   ```

### Security Enhancements for Production

1. **Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```
   
   ```javascript
   import rateLimit from 'express-rate-limit';
   
   const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5, // limit each IP to 5 requests per windowMs
     message: 'Too many authentication attempts, please try again later.'
   });
   
   app.use('/api/login', authLimiter);
   app.use('/api/register', authLimiter);
   ```

2. **Helmet for Security Headers**
   ```bash
   npm install helmet
   ```
   
   ```javascript
   import helmet from 'helmet';
   app.use(helmet());
   ```

3. **Input Validation**
   ```bash
   npm install joi
   ```

### Monitoring and Logging

1. **Add Logging**
   ```bash
   npm install winston
   ```

2. **Health Checks**
   ```javascript
   app.get('/health', (req, res) => {
     res.json({
       status: 'OK',
       timestamp: new Date().toISOString(),
       uptime: process.uptime()
     });
   });
   ```

### SSL/HTTPS Setup

For custom domains, ensure HTTPS is enabled:

1. **Let's Encrypt** (for VPS/dedicated servers)
2. **Cloudflare** (for DNS and SSL)
3. **Platform SSL** (most platforms provide automatic SSL)

### Performance Optimization

1. **Compression**
   ```bash
   npm install compression
   ```

2. **Static File Caching**
   ```javascript
   app.use(express.static('public', {
     maxAge: '1d',
     etag: false
   }));
   ```

3. **Session Store**
   ```bash
   npm install connect-redis redis
   ```

### Backup Strategy

1. **Database Backups** (if using database)
2. **Environment Variable Backup**
3. **Code Repository Backup**

## 🔧 Troubleshooting Production Issues

### Common Issues

1. **Environment Variables Not Loading**
   - Check platform-specific environment variable setup
   - Verify variable names match exactly

2. **Session Issues**
   - Ensure SESSION_SECRET is set
   - Check cookie settings for HTTPS

3. **CORS Errors**
   - Update CORS configuration for production domain
   - Check allowed origins

4. **Firebase Authentication Errors**
   - Verify Firebase project configuration
   - Check service account credentials
   - Ensure Firebase project has correct domain settings

### Monitoring

Set up monitoring for:
- Server uptime
- Response times
- Error rates
- User authentication success/failure rates

### Logs

Monitor logs for:
- Authentication attempts
- Server errors
- Performance issues
- Security incidents
