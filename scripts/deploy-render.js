#!/usr/bin/env node

/**
 * Render Deployment Script for AI-Coder Backend
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🚀 Starting Render deployment for AI-Coder Backend...');

// Check if Render CLI is installed
function checkRenderCLI() {
    try {
        execSync('render --version', { stdio: 'pipe' });
        console.log('✅ Render CLI is installed');
        return true;
    } catch (error) {
        console.log('❌ Render CLI not found');
        console.log('💡 Install with: npm install -g @render/cli');
        return false;
    }
}

// Validate backend configuration
function validateBackendConfiguration() {
    console.log('🔍 Validating backend configuration...');
    
    const requiredFiles = [
        'server/index.js',
        'package.json',
        'render.yaml'
    ];
    
    for (const file of requiredFiles) {
        const filePath = path.join(projectRoot, file);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Required file not found: ${file}`);
            return false;
        }
    }
    
    console.log('✅ Backend configuration validated');
    return true;
}

// Check environment variables
function checkEnvironmentVariables() {
    console.log('🔧 Checking environment variables...');
    
    const requiredEnvVars = [
        'DATABASE_URL',
        'SESSION_SECRET',
        'GEMINI_API_KEY'
    ];
    
    const envFile = path.join(projectRoot, '.env');
    let envVars = {};
    
    if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                envVars[key.trim()] = value.trim();
            }
        });
    }
    
    const missingVars = requiredEnvVars.filter(varName => !envVars[varName] && !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.log('⚠️  Missing environment variables:');
        missingVars.forEach(varName => {
            console.log(`   - ${varName}`);
        });
        console.log('💡 These will need to be set in the Render dashboard');
    } else {
        console.log('✅ All required environment variables found');
    }
    
    return true;
}

// Main deployment function
async function main() {
    try {
        console.log('🎯 AI-Coder Render Deployment');
        console.log('==============================');
        
        // Step 1: Check prerequisites
        if (!checkRenderCLI()) {
            console.log('⚠️  Manual deployment required via Render dashboard');
        }
        
        // Step 2: Validate configuration
        if (!validateBackendConfiguration()) {
            process.exit(1);
        }
        
        // Step 3: Check environment variables
        checkEnvironmentVariables();
        
        console.log('');
        console.log('🎉 Render deployment preparation completed!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Push code to GitHub repository');
        console.log('2. Create Web Service in Render dashboard');
        console.log('3. Set environment variables');
        console.log('4. Deploy from Render dashboard');
        
    } catch (error) {
        console.error('💥 Deployment preparation failed:', error.message);
        process.exit(1);
    }
}

// Run the deployment
main();
