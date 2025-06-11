#!/usr/bin/env node

/**
 * Netlify Deployment Script for AI-Coder Frontend
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🚀 Starting Netlify deployment for AI-Coder Frontend...');

// Check if Netlify CLI is installed
function checkNetlifyCLI() {
    try {
        execSync('netlify --version', { stdio: 'pipe' });
        console.log('✅ Netlify CLI is installed');
        return true;
    } catch (error) {
        console.log('❌ Netlify CLI not found');
        console.log('💡 Install with: npm install -g netlify-cli');
        return false;
    }
}

// Validate configuration
function validateConfiguration() {
    console.log('🔍 Validating configuration...');
    
    const netlifyToml = path.join(projectRoot, 'netlify.toml');
    const configJs = path.join(projectRoot, 'public', 'config.js');
    const publicDir = path.join(projectRoot, 'public');
    
    if (!fs.existsSync(netlifyToml)) {
        console.error('❌ netlify.toml not found');
        return false;
    }
    
    if (!fs.existsSync(configJs)) {
        console.error('❌ public/config.js not found');
        return false;
    }
    
    if (!fs.existsSync(publicDir)) {
        console.error('❌ public directory not found');
        return false;
    }
    
    console.log('✅ Configuration files validated');
    return true;
}

// Deploy to Netlify
function deployToNetlify() {
    console.log('🚀 Deploying to Netlify...');
    
    try {
        // Check if site is already linked
        const siteConfigPath = path.join(projectRoot, '.netlify', 'state.json');
        
        if (!fs.existsSync(siteConfigPath)) {
            console.log('🔗 Site not linked to Netlify');
            console.log('💡 Run: netlify link');
            console.log('💡 Or create new site: netlify sites:create');
            return false;
        }
        
        // Deploy to production
        console.log('📤 Deploying to production...');
        execSync('netlify deploy --prod --dir=public', { 
            stdio: 'inherit',
            cwd: projectRoot 
        });
        
        console.log('🎉 Deployment successful!');
        return true;
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        return false;
    }
}

// Main deployment function
async function main() {
    try {
        console.log('🎯 AI-Coder Netlify Deployment');
        console.log('===============================');
        
        // Step 1: Check prerequisites
        if (!checkNetlifyCLI()) {
            console.log('⚠️  Manual deployment required via Netlify dashboard');
            return;
        }
        
        // Step 2: Validate configuration
        if (!validateConfiguration()) {
            process.exit(1);
        }
        
        // Step 3: Deploy
        if (!deployToNetlify()) {
            console.log('⚠️  Manual deployment required');
        }
        
        console.log('');
        console.log('🎉 Netlify deployment completed!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Test the deployed frontend');
        console.log('2. Verify API connections work');
        console.log('3. Test authentication flow');
        console.log('4. Test agent mode functionality');
        
    } catch (error) {
        console.error('💥 Deployment failed:', error.message);
        process.exit(1);
    }
}

// Run the deployment
main();
