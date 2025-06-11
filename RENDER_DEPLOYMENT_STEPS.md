# Render Backend Deployment Steps

## 🎯 Current Status
- ✅ Frontend deployed to Netlify: https://ai-coder-frontend.netlify.app
- 🔄 Backend deployment to Render (in progress)
- 📋 All configuration files ready

## 🚀 Backend Deployment Process

### Step 1: Create PostgreSQL Database

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Create Database**:
   - Click "New +" → "PostgreSQL"
   - Name: `ai-coder-db`
   - Database Name: `ai_coder_production`
   - User: `ai_coder_user`
   - Region: Choose closest to your users
   - Plan: Starter (free tier)
3. **Save Database Details**:
   - Note the DATABASE_URL (will be auto-generated)
   - Database will be available in ~2-3 minutes

### Step 2: Create Web Service

1. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect GitHub repository: `AI-coder-main`
   - Name: `ai-coder-backend`
   - Environment: `Node`
   - Region: Same as database
   - Branch: `main`

2. **Configure Build Settings**:
   ```
   Build Command: pnpm install
   Start Command: node server/index.js
   ```

3. **Advanced Settings**:
   - Auto-Deploy: Yes
   - Health Check Path: `/api/health`

### Step 3: Set Environment Variables

**Required Environment Variables:**

```bash
# Server Configuration
NODE_ENV=production
PORT=10000

# Session Security (CRITICAL - Generate secure random string)
SESSION_SECRET=your-super-secure-random-string-at-least-32-characters

# Database (Auto-set when linking database)
DATABASE_URL=postgresql://username:password@hostname:port/database
USE_DATABASE=true

# AI Service API (Get from Google AI Studio)
GEMINI_API_KEY=your-actual-gemini-api-key-here

# CORS Configuration (Frontend URL)
CORS_ORIGIN=https://ai-coder-frontend.netlify.app

# Render-specific
RENDER_DEPLOYMENT=true
SECURE_COOKIES=true
TRUST_PROXY=true

# Optional: Firebase (if using Google Auth)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
```

### Step 4: Link Database to Web Service

1. **In Web Service Settings**:
   - Go to Environment tab
   - Add environment variable: `DATABASE_URL`
   - Value: Select "From Database" → Choose `ai-coder-db`
   - This will auto-populate the connection string

### Step 5: Deploy and Monitor

1. **Deploy Service**:
   - Click "Deploy Latest Commit"
   - Monitor build logs for any errors
   - Deployment typically takes 3-5 minutes

2. **Verify Deployment**:
   - Check health endpoint: `https://your-service.onrender.com/api/health`
   - Should return: `{"status": "OK", "timestamp": "..."}`

## 🔧 Environment Variables Setup Guide

### Generate SESSION_SECRET
```bash
# Use this command to generate a secure session secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Get GEMINI_API_KEY
1. Go to Google AI Studio: https://makersuite.google.com/app/apikey
2. Create new API key
3. Copy the key (starts with "AIza...")

### Firebase Setup (Optional - for Google Auth)
1. Go to Firebase Console: https://console.firebase.google.com
2. Create project or use existing
3. Go to Project Settings → Service Accounts
4. Generate new private key
5. Use the downloaded JSON for environment variables

## 🧪 Testing After Deployment

### Backend Health Check
```bash
curl https://your-backend-url.onrender.com/api/health
```

### Frontend-Backend Connection
1. Open: https://ai-coder-frontend.netlify.app
2. Check browser console for any CORS errors
3. Try user registration/login
4. Test agent mode (requires authentication)

## 🔍 Troubleshooting

### Common Issues

**Build Failures:**
- Check if `pnpm install` completes successfully
- Verify all dependencies are in package.json
- Check Node.js version compatibility

**Database Connection:**
- Verify DATABASE_URL is correctly set
- Check if database is running and accessible
- Review connection logs in Render dashboard

**CORS Errors:**
- Verify CORS_ORIGIN matches Netlify URL exactly
- Check if credentials are included in requests
- Ensure sameSite cookie settings are correct

**Environment Variables:**
- Double-check all required variables are set
- Verify no typos in variable names
- Ensure sensitive values are properly escaped

### Logs and Monitoring
- **Build Logs**: Available during deployment
- **Runtime Logs**: Real-time in Render dashboard
- **Database Logs**: In PostgreSQL service dashboard
- **Health Checks**: Automatic monitoring of `/api/health`

## 📋 Post-Deployment Checklist

- [ ] Backend health endpoint responds
- [ ] Database connection established
- [ ] Frontend can reach backend APIs
- [ ] User authentication works
- [ ] Agent mode functions properly
- [ ] SSE streaming works for real-time updates
- [ ] All environment variables set correctly
- [ ] CORS configuration allows frontend requests

## 🎯 Expected URLs After Deployment

- **Frontend**: https://ai-coder-frontend.netlify.app
- **Backend**: https://ai-coder-backend.onrender.com
- **Health Check**: https://ai-coder-backend.onrender.com/api/health
- **Admin Dashboard**: https://dashboard.render.com

---

**Next Steps**: Follow this guide to complete the backend deployment, then test all functionality to ensure the migration from Vercel to Netlify+Render is successful.
