#!/usr/bin/env node

/**
 * Environment Variables Setup Script
 * 
 * This script helps set up environment variables for Netlify and Render deployment
 * and validates the configuration.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔧 Environment Variables Setup for Netlify + Render Deployment');
console.log('==============================================================');

// Generate secure session secret
function generateSessionSecret() {
    return crypto.randomBytes(32).toString('hex');
}

// Validate environment variables
function validateEnvironmentVariables() {
    console.log('\n🔍 Validating environment variables...');
    
    const envFile = path.join(projectRoot, '.env');
    const prodEnvFile = path.join(projectRoot, '.env.production');
    
    let envVars = {};
    
    // Read current .env file
    if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        });
    }
    
    const requiredVars = {
        'NODE_ENV': 'production',
        'SESSION_SECRET': generateSessionSecret(),
        'DATABASE_URL': 'postgresql://username:password@hostname:port/database',
        'USE_DATABASE': 'true',
        'GEMINI_API_KEY': 'your-gemini-api-key-here',
        'CORS_ORIGIN': 'https://ai-coder-frontend.netlify.app',
        'RENDER_DEPLOYMENT': 'true'
    };
    
    const optionalVars = {
        'FIREBASE_PROJECT_ID': 'your-firebase-project-id',
        'FIREBASE_CLIENT_EMAIL': 'your-service-account@your-project.iam.gserviceaccount.com',
        'FIREBASE_PRIVATE_KEY': '"-----BEGIN PRIVATE KEY-----\\nYour private key here\\n-----END PRIVATE KEY-----"',
        'LOG_LEVEL': 'info',
        'AGENT_TIMEOUT': '30000',
        'RATE_LIMIT_WINDOW': '15',
        'RATE_LIMIT_MAX': '100'
    };
    
    console.log('\n📋 Required Environment Variables:');
    console.log('==================================');
    
    const missingRequired = [];
    const needsUpdate = [];
    
    Object.entries(requiredVars).forEach(([key, defaultValue]) => {
        const currentValue = envVars[key];
        
        if (!currentValue) {
            missingRequired.push(key);
            console.log(`❌ ${key}: NOT SET`);
        } else if (currentValue.includes('your-') || currentValue.includes('change-') || currentValue === defaultValue) {
            needsUpdate.push(key);
            console.log(`⚠️  ${key}: NEEDS UPDATE (${currentValue.substring(0, 30)}...)`);
        } else {
            console.log(`✅ ${key}: SET`);
        }
    });
    
    console.log('\n📋 Optional Environment Variables:');
    console.log('==================================');
    
    Object.entries(optionalVars).forEach(([key, defaultValue]) => {
        const currentValue = envVars[key];
        
        if (!currentValue) {
            console.log(`⚪ ${key}: NOT SET (optional)`);
        } else if (currentValue.includes('your-') || currentValue === defaultValue) {
            console.log(`⚠️  ${key}: NEEDS UPDATE (${currentValue.substring(0, 30)}...)`);
        } else {
            console.log(`✅ ${key}: SET`);
        }
    });
    
    return { missingRequired, needsUpdate, envVars };
}

// Generate production environment file
function generateProductionEnvFile(envVars) {
    console.log('\n📝 Generating production environment file...');
    
    const prodEnvContent = `# Production Environment Variables for Render Deployment
# Generated on ${new Date().toISOString()}

# Server Configuration
NODE_ENV=production
PORT=10000

# Session Security (IMPORTANT: Change this!)
SESSION_SECRET=${envVars.SESSION_SECRET || generateSessionSecret()}

# Database Configuration (Set in Render dashboard)
DATABASE_URL=${envVars.DATABASE_URL || 'postgresql://username:password@hostname:port/database'}
USE_DATABASE=true

# AI Service APIs (Set in Render dashboard)
GEMINI_API_KEY=${envVars.GEMINI_API_KEY || 'your-gemini-api-key-here'}

# Firebase Authentication (Optional - Set in Render dashboard)
FIREBASE_PROJECT_ID=${envVars.FIREBASE_PROJECT_ID || 'your-firebase-project-id'}
FIREBASE_CLIENT_EMAIL=${envVars.FIREBASE_CLIENT_EMAIL || 'your-service-account@your-project.iam.gserviceaccount.com'}
FIREBASE_PRIVATE_KEY=${envVars.FIREBASE_PRIVATE_KEY || '"-----BEGIN PRIVATE KEY-----\\nYour private key here\\n-----END PRIVATE KEY-----"'}

# CORS Configuration
CORS_ORIGIN=https://ai-coder-frontend.netlify.app

# Render-specific settings
RENDER_DEPLOYMENT=true

# Security Settings
SECURE_COOKIES=true
TRUST_PROXY=true

# Logging and Performance
LOG_LEVEL=info
AGENT_TIMEOUT=30000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Health Check Configuration
HEALTH_CHECK_TIMEOUT=5000
`;
    
    const prodEnvFile = path.join(projectRoot, '.env.production');
    fs.writeFileSync(prodEnvFile, prodEnvContent);
    
    console.log(`✅ Production environment file created: ${prodEnvFile}`);
}

// Generate Render environment variables script
function generateRenderEnvScript() {
    console.log('\n📝 Generating Render environment variables script...');
    
    const renderScript = `#!/bin/bash
# Render Environment Variables Setup Script
# Run this script to set environment variables in Render CLI

echo "🔧 Setting up Render environment variables..."

# Required variables (update these values!)
render env set NODE_ENV production
render env set PORT 10000
render env set SESSION_SECRET "$(openssl rand -hex 32)"
render env set USE_DATABASE true
render env set RENDER_DEPLOYMENT true
render env set CORS_ORIGIN "https://ai-coder-frontend.netlify.app"

# API Keys (set these manually with your actual keys)
echo "⚠️  Please set these manually in Render dashboard:"
echo "   GEMINI_API_KEY=your-actual-gemini-api-key"
echo "   DATABASE_URL=postgresql://... (auto-set when linking database)"

# Optional Firebase variables
echo "📝 Optional Firebase variables (if using Google Auth):"
echo "   FIREBASE_PROJECT_ID=your-firebase-project-id"
echo "   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com"
echo "   FIREBASE_PRIVATE_KEY=your-firebase-private-key"

echo "✅ Basic environment variables set!"
echo "🔗 Complete setup in Render dashboard: https://dashboard.render.com"
`;
    
    const scriptPath = path.join(projectRoot, 'scripts', 'render-env-setup.sh');
    fs.writeFileSync(scriptPath, renderScript);
    
    // Make script executable on Unix systems
    try {
        execSync(`chmod +x "${scriptPath}"`);
    } catch (error) {
        // Ignore on Windows
    }
    
    console.log(`✅ Render environment script created: ${scriptPath}`);
}

// Generate deployment checklist
function generateDeploymentChecklist() {
    console.log('\n📝 Generating deployment checklist...');
    
    const checklist = `# Deployment Checklist for Netlify + Render

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
- [ ] Set build command: \`pnpm install\`
- [ ] Set start command: \`node server/index.js\`
- [ ] Configure health check: \`/api/health\`

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
- [ ] Set publish directory: \`public\`
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
\`\`\`bash
# Check backend health
curl https://your-app.onrender.com/api/health

# View Render logs
render logs

# Deploy to Netlify
netlify deploy --prod --dir=public
\`\`\`

---

Generated on: ${new Date().toISOString()}
`;
    
    const checklistPath = path.join(projectRoot, 'DEPLOYMENT_CHECKLIST.md');
    fs.writeFileSync(checklistPath, checklist);
    
    console.log(`✅ Deployment checklist created: ${checklistPath}`);
}

// Main function
async function main() {
    try {
        // Validate current environment variables
        const { missingRequired, needsUpdate, envVars } = validateEnvironmentVariables();
        
        // Generate production environment file
        generateProductionEnvFile(envVars);
        
        // Generate Render environment script
        generateRenderEnvScript();
        
        // Generate deployment checklist
        generateDeploymentChecklist();
        
        console.log('\n🎯 SUMMARY:');
        console.log('===========');
        
        if (missingRequired.length > 0) {
            console.log(`❌ Missing required variables: ${missingRequired.join(', ')}`);
        }
        
        if (needsUpdate.length > 0) {
            console.log(`⚠️  Variables needing updates: ${needsUpdate.join(', ')}`);
        }
        
        console.log('✅ Production environment file generated');
        console.log('✅ Render environment script generated');
        console.log('✅ Deployment checklist generated');
        
        console.log('\n🔗 NEXT STEPS:');
        console.log('1. Update environment variables with actual values');
        console.log('2. Set environment variables in Render dashboard');
        console.log('3. Follow the deployment checklist');
        console.log('4. Test thoroughly after deployment');
        
        console.log('\n📁 FILES GENERATED:');
        console.log('• .env.production - Production environment template');
        console.log('• scripts/render-env-setup.sh - Render CLI environment script');
        console.log('• DEPLOYMENT_CHECKLIST.md - Complete deployment checklist');
        
    } catch (error) {
        console.error('💥 Setup failed:', error.message);
        process.exit(1);
    }
}

// Run the setup
main();
