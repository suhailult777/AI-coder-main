# Netlify + Render Deployment Guide

This guide walks you through deploying the AI-Coder application to Netlify (frontend) and Render (backend), replacing the previous Vercel deployment.

## 🏗️ Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐
│    Netlify      │────▶│     Render      │
│   (Frontend)    │     │   (Backend)     │
│                 │     │                 │
│ • Static Files  │     │ • Express.js    │
│ • API Proxy     │     │ • Authentication│
│ • CDN          │     │ • Agent Mode    │
│                 │     │ • SSE Streaming │
│                 │     │ • PostgreSQL    │
└─────────────────┘     └─────────────────┘
```

## 📋 Prerequisites

### 1. Account Setup

- [ ] [Netlify account](https://netlify.com)
- [ ] [Render account](https://render.com)
- [ ] GitHub repository with your code

### 2. API Keys Required

- [ ] OpenRouter API Key
- [ ] Gemini API Key (optional)
- [ ] Firebase project credentials (for Google auth)

### 3. Tools Installation

```powershell
# Install pnpm (if not already installed)
npm install -g pnpm

# Install Netlify CLI
pnpm install -g netlify-cli

# Install dependencies
pnpm install
```

## 🎯 Part 1: Backend Deployment (Render)

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "PostgreSQL"
3. Configure:
   - **Name**: `ai-coder-db`
   - **Database**: `ai_coder_production`
   - **User**: `ai_coder_user`
   - **Plan**: Starter (or your preferred plan)
4. Click "Create Database"
5. **Save the connection string** for later

### Step 2: Deploy Backend Service

1. In Render Dashboard, click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `ai-coder-backend`
   - **Environment**: `Node`
   - **Build Command**: `pnpm install`
   - **Start Command**: `node server/index.js`
   - **Plan**: Starter (or your preferred plan)

### Step 3: Set Environment Variables

In your Render service settings, add these environment variables:

```bash
NODE_ENV=production
PORT=10000
SESSION_SECRET=your-super-secure-random-string-at-least-32-characters
DATABASE_URL=postgresql://username:password@hostname:port/database
GEMINI_API_KEY=your-gemini-api-key-here
OPENROUTER_API_KEY=your-openrouter-api-key-here
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
FRONTEND_URL=https://your-netlify-app.netlify.app
```

**Important Notes:**

- Replace `your-netlify-app` with your actual Netlify app name
- The `DATABASE_URL` will be automatically provided if you link the database
- `SESSION_SECRET` should be a random string of at least 32 characters

### Step 4: Deploy Backend

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note your backend URL: `https://your-app-name.onrender.com`

## 🌐 Part 2: Frontend Deployment (Netlify)

### Step 1: Update Frontend Configuration

The frontend is already configured with `public/config.js` that automatically detects the environment and sets the correct API URL. The configuration will automatically use:

```javascript
// For Netlify deployment
API_BASE_URL: "https://ai-coder-backend.onrender.com";

// For local development
API_BASE_URL: "http://localhost:3000";
```

No manual configuration needed - the app will automatically detect the environment!

### Step 2: Deploy to Netlify

#### Option A: Using Netlify CLI

```powershell
# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir public
```

#### Option B: Using Git Integration

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `echo 'Static site - no build needed'`
   - **Publish directory**: `public`
5. Click "Deploy site"

### Step 3: Configure Netlify Settings

The `netlify.toml` file should already be configured with:

- API proxy rules to your Render backend
- CORS headers
- Redirects for SPA routing

Verify in your Netlify site settings that the redirects are working.

## 🔧 Part 3: Configuration Updates

### Update CORS Settings

Make sure your Render backend allows your Netlify domain. The server should automatically pick up the `FRONTEND_URL` environment variable.

### Test the Deployment

1. **Test Frontend**: Visit your Netlify URL
2. **Test Backend**: Visit `https://your-render-app.onrender.com/api/health`
3. **Test Authentication**: Try signing up/logging in
4. **Test Agent Mode**: Verify agent functionality works
5. **Test SSE**: Check real-time updates in agent mode

## 🚀 Automated Deployment

Use the provided deployment scripts:

### PowerShell (Windows)

```powershell
.\deploy.ps1
```

### Bash (Linux/macOS)

```bash
chmod +x deploy.sh
./deploy.sh
```

## 🐛 Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem**: "Access to fetch at 'https://render-app.onrender.com' from origin 'https://netlify-app.netlify.app' has been blocked by CORS policy"

**Solution**:

- Verify `FRONTEND_URL` environment variable in Render
- Check that your Netlify domain is in the allowed origins

#### 2. Authentication Issues

**Problem**: User sessions not persisting

**Solution**:

- Ensure `SESSION_SECRET` is set in Render
- Verify database connection is working
- Check cookie settings for cross-domain

#### 3. Agent Mode Not Working

**Problem**: Agent mode fails to start

**Solution**:

- Check Render logs for errors
- Verify all environment variables are set
- Ensure the agent directory structure is correct

#### 4. SSE Connection Fails

**Problem**: Real-time updates not working

**Solution**:

- Check that SSE endpoint is accessible
- Verify authentication is working
- Check browser console for connection errors

### Checking Logs

#### Render Logs

1. Go to your Render service dashboard
2. Click on "Logs" tab
3. Monitor for errors during deployment and runtime

#### Netlify Logs

1. Go to your Netlify site dashboard
2. Click on "Functions" → "Edge Functions" for any function logs
3. Check "Deploy log" for build issues

## 📊 Performance Optimization

### Render Optimizations

- Use persistent disks for file storage if needed
- Configure health checks
- Set up monitoring and alerts

### Netlify Optimizations

- Enable asset optimization
- Use Netlify Analytics
- Configure caching headers

## 🔄 Updates and Maintenance

### Updating the Application

1. Push changes to your GitHub repository
2. Render will auto-deploy backend changes
3. Netlify will auto-deploy frontend changes
4. Monitor logs for any deployment issues

### Database Maintenance

- Regular backups are handled by Render
- Monitor database performance in Render dashboard
- Scale database plan as needed

## 🏆 Success Checklist

- [ ] Backend deployed to Render successfully
- [ ] Frontend deployed to Netlify successfully
- [ ] Environment variables configured correctly
- [ ] Database connected and migrations run
- [ ] Authentication working (local + Google)
- [ ] Agent mode functioning correctly
- [ ] SSE streaming working in real-time
- [ ] CORS configured properly
- [ ] All API endpoints responding correctly
- [ ] Process spawning working for agent operations
- [ ] File system operations working for code generation

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Render and Netlify documentation
3. Check application logs for error details
4. Verify all environment variables are set correctly

---

**Congratulations! 🎉** Your AI-Coder application is now successfully deployed to Netlify and Render with full functionality preserved from the Vercel deployment.
