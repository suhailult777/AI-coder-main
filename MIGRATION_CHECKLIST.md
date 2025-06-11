# Migration Checklist: Vercel → Netlify + Render

This checklist ensures a smooth migration from Vercel to the new Netlify (frontend) + Render (backend) architecture.

## 📋 Pre-Migration Preparation

### ✅ Backup Current Deployment
- [ ] Export current environment variables from Vercel
- [ ] Backup user database (if any)
- [ ] Document current functionality working properly
- [ ] Take screenshots of working application
- [ ] Note current domain/URL

### ✅ Account Setup
- [ ] Create Netlify account
- [ ] Create Render account  
- [ ] Verify GitHub repository access
- [ ] Prepare API keys and credentials

## 🔧 Code Modifications Completed

### ✅ Backend Configuration
- [x] Updated CORS settings for cross-origin requests
- [x] Added production environment variable handling
- [x] Enhanced logging for debugging
- [x] Maintained all existing functionality (auth, agent mode, SSE)

### ✅ Frontend Configuration  
- [x] Created configuration system for API endpoints
- [x] Updated all fetch calls to use configuration
- [x] Maintained backward compatibility for local development
- [x] Added production configuration file

### ✅ Deployment Configuration
- [x] Created `render.yaml` for backend deployment
- [x] Created `netlify.toml` for frontend deployment and API proxying
- [x] Added environment variable templates
- [x] Created deployment scripts

## 🚀 Deployment Steps

### Step 1: Backend Deployment (Render)
- [ ] Create PostgreSQL database on Render
- [ ] Deploy backend service to Render
- [ ] Configure environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `SESSION_SECRET` (new secure value)
  - [ ] `DATABASE_URL` (from Render database)
  - [ ] `GEMINI_API_KEY`
  - [ ] `OPENROUTER_API_KEY`
  - [ ] `FIREBASE_PROJECT_ID`
  - [ ] `FIREBASE_CLIENT_EMAIL`
  - [ ] `FIREBASE_PRIVATE_KEY`
  - [ ] `FRONTEND_URL` (will be Netlify URL)
- [ ] Verify backend deployment successful
- [ ] Test `/api/health` endpoint

### Step 2: Frontend Configuration
- [ ] Update `public/config.js` with Render backend URL
- [ ] Verify all API calls use configuration system
- [ ] Test local development still works

### Step 3: Frontend Deployment (Netlify)
- [ ] Deploy frontend to Netlify
- [ ] Configure build settings (publish directory: `public`)
- [ ] Verify API proxy rules working
- [ ] Test frontend loads correctly

### Step 4: Cross-Platform Integration
- [ ] Update `FRONTEND_URL` in Render with actual Netlify URL
- [ ] Test authentication works across domains
- [ ] Verify SSE streaming works
- [ ] Test agent mode functionality

## 🧪 Testing Checklist

### ✅ Core Functionality
- [ ] Homepage loads correctly
- [ ] Code generation works (normal mode)
- [ ] Model selection working
- [ ] Copy functionality working
- [ ] Theme toggle working

### ✅ Authentication System
- [ ] User registration works
- [ ] User login works
- [ ] Google authentication works (if configured)
- [ ] Session persistence across page refreshes
- [ ] Logout functionality works

### ✅ Agent Mode
- [ ] Agent mode toggle works
- [ ] Agent mode requires authentication
- [ ] Agent can receive prompts
- [ ] Agent process spawning works
- [ ] VSCode integration works
- [ ] Real-time status updates (SSE) work

### ✅ Real-time Features
- [ ] SSE connection establishes successfully
- [ ] Status updates appear in real-time
- [ ] Connection indicators work
- [ ] Reconnection handling works

### ✅ Cross-Domain Features
- [ ] CORS headers configured correctly
- [ ] Cookies work across domains
- [ ] Authentication sessions persist
- [ ] API calls successful from frontend to backend

## 🔍 Troubleshooting Verification

### ✅ Common Issues Checked
- [ ] CORS errors resolved
- [ ] Authentication sessions working
- [ ] SSE connections established
- [ ] Agent processes can spawn
- [ ] File system operations work
- [ ] Database connections stable

### ✅ Performance Verification
- [ ] Page load times acceptable
- [ ] API response times good
- [ ] SSE latency minimal
- [ ] No memory leaks in long-running processes

## 📊 Post-Migration Verification

### ✅ Automated Testing
- [ ] Run deployment verification script: `node verify-deployment.js`
- [ ] All automated tests pass
- [ ] Manual testing confirms functionality

### ✅ User Experience
- [ ] Application feels as responsive as before
- [ ] All features work identically
- [ ] No broken functionality identified
- [ ] User flows complete successfully

## 🌐 DNS and Domain Migration

### ✅ Domain Configuration (Optional)
- [ ] Configure custom domain on Netlify (if desired)
- [ ] Update DNS records
- [ ] Configure SSL certificates
- [ ] Test domain propagation

## 📈 Monitoring Setup

### ✅ Production Monitoring
- [ ] Render service monitoring enabled
- [ ] Netlify analytics configured (optional)
- [ ] Error logging configured
- [ ] Performance monitoring enabled

## 🎯 Final Verification

### ✅ Complete Feature Parity
- [ ] All Vercel functionality replicated
- [ ] Performance is equivalent or better
- [ ] No regressions identified
- [ ] User experience unchanged

### ✅ Documentation Updated
- [ ] README updated with new deployment info
- [ ] Environment variable documentation current
- [ ] Deployment guide accessible
- [ ] Troubleshooting guide available

## 🔄 Rollback Plan (If Needed)

### ✅ Rollback Preparation
- [ ] Vercel deployment still accessible
- [ ] Ability to revert DNS changes
- [ ] Database backup available
- [ ] User data preservation plan

---

## ✅ Migration Complete!

**Date Completed**: ___________  
**Migrated By**: ___________  
**New URLs**:
- Frontend: https://_____.netlify.app
- Backend: https://_____.onrender.com

**Performance Notes**:
- Loading time: _____
- API response time: _____
- Issues encountered: _____
- Resolution notes: _____

**Success Criteria Met**: ☐ All functionality working ☐ Performance acceptable ☐ No user impact

---

*This migration successfully moves the AI-Coder application from Vercel's serverless architecture to a more traditional setup with Netlify for static hosting and Render for the full backend server, preserving all functionality including process spawning, file operations, and real-time features.*
