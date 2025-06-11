# Deployment Checklist for Netlify + Render

## Pre-Deployment Setup

### 1. Environment Variables
- [ ] Generate secure SESSION_SECRET (32+ characters)
- [ ] Obtain Gemini API key from Google AI Studio
- [ ] Set up Firebase project (if using Google Auth)
- [ ] Update CORS_ORIGIN with your Netlify URL

### 2. Repository Setup
- [ ] Push all code to GitHub repository
- [ ] Verify all configuration files are committed
- [ ] Test application locally

## Render Backend Deployment

### 1. Database Setup
- [ ] Create PostgreSQL database in Render
- [ ] Note the DATABASE_URL connection string
- [ ] Verify database is accessible

### 2. Web Service Setup
- [ ] Create new Web Service in Render
- [ ] Connect GitHub repository
- [ ] Set build command: `pnpm install`
- [ ] Set start command: `node server/index.js`
- [ ] Configure health check: `/api/health`

### 3. Environment Variables
- [ ] Set NODE_ENV=production
- [ ] Set SESSION_SECRET (secure random string)
- [ ] Set DATABASE_URL (from database service)
- [ ] Set GEMINI_API_KEY
- [ ] Set CORS_ORIGIN (Netlify URL)
- [ ] Set USE_DATABASE=true
- [ ] Set RENDER_DEPLOYMENT=true

### 4. Deployment Verification
- [ ] Service deploys successfully
- [ ] Health check endpoint responds
- [ ] Database connection works
- [ ] API endpoints are accessible

## Netlify Frontend Deployment

### 1. Site Setup
- [ ] Create new site in Netlify
- [ ] Connect GitHub repository
- [ ] Set publish directory: `public`
- [ ] Configure build settings (no build command needed)

### 2. Configuration
- [ ] Verify netlify.toml is configured
- [ ] Check API proxy redirects work
- [ ] Test CORS configuration

### 3. Deployment Verification
- [ ] Site deploys successfully
- [ ] Frontend loads correctly
- [ ] API calls work (check browser network tab)
- [ ] Authentication flow works

## Post-Deployment Testing

### 1. Basic Functionality
- [ ] User registration works
- [ ] User login works
- [ ] Normal mode code generation works
- [ ] UI is responsive and functional

### 2. Agent Mode Testing
- [ ] Agent mode requires authentication
- [ ] Agent mode activates successfully
- [ ] Real-time status updates work (SSE)
- [ ] Process spawning works
- [ ] VSCode integration works (simulated)

### 3. Performance Testing
- [ ] Page load times are acceptable
- [ ] API response times are good
- [ ] Database queries are efficient
- [ ] No memory leaks or errors

## Monitoring and Maintenance

### 1. Setup Monitoring
- [ ] Configure uptime monitoring
- [ ] Set up error tracking
- [ ] Monitor resource usage
- [ ] Set up backup schedules

### 2. Security
- [ ] Verify HTTPS is enabled
- [ ] Check CORS configuration
- [ ] Review environment variables
- [ ] Test authentication security

## Troubleshooting

### Common Issues
- CORS errors: Check CORS_ORIGIN setting
- Authentication issues: Verify SESSION_SECRET and database
- Agent mode failures: Check GEMINI_API_KEY and logs
- SSE connection issues: Verify authentication and network

### Useful Commands
```bash
# Check backend health
curl https://your-app.onrender.com/api/health

# View Render logs
render logs

# Deploy to Netlify
netlify deploy --prod --dir=public
```

---

Generated on: 2025-06-11T19:51:09.414Z
