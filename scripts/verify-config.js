#!/usr/bin/env node

/**
 * Configuration Verification Script
 * This script verifies that all deployment configuration is correct
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔍 Verifying AI-Coder deployment configuration...');
console.log('================================================');

// Check if all required files exist
const requiredFiles = [
    'netlify.toml',
    'render.yaml',
    'public/config.js',
    'public/index.html',
    'server/index.js',
    'package.json',
    '.env.production'
];

const deploymentScripts = [
    'scripts/deploy-render.js',
    'scripts/deploy-netlify.js',
    'scripts/setup-env-vars.js'
];

const documentationFiles = [
    'NETLIFY_RENDER_DEPLOYMENT.md',
    'DEPLOYMENT_CHECKLIST.md'
];

console.log('\n📁 Checking required configuration files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

console.log('\n🔧 Checking deployment scripts...');
deploymentScripts.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

console.log('\n📚 Checking documentation...');
documentationFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
try {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredScripts = ['deploy:netlify', 'deploy:render', 'start'];
    
    requiredScripts.forEach(script => {
        if (packageJson.scripts && packageJson.scripts[script]) {
            console.log(`✅ npm script: ${script}`);
        } else {
            console.log(`❌ npm script: ${script} - MISSING`);
            allFilesExist = false;
        }
    });
} catch (error) {
    console.log('❌ Error reading package.json');
    allFilesExist = false;
}

// Verify configuration content
console.log('\n🔍 Verifying configuration content...');

// Check netlify.toml
try {
    const netlifyConfigPath = path.join(projectRoot, 'netlify.toml');
    const netlifyConfig = fs.readFileSync(netlifyConfigPath, 'utf8');
    if (netlifyConfig.includes('ai-coder-backend.onrender.com')) {
        console.log('✅ Netlify config has correct backend URL');
    } else {
        console.log('⚠️  Netlify config may need backend URL update');
    }
} catch (error) {
    console.log('❌ Error reading netlify.toml');
}

// Check render.yaml
try {
    const renderConfigPath = path.join(projectRoot, 'render.yaml');
    const renderConfig = fs.readFileSync(renderConfigPath, 'utf8');
    if (renderConfig.includes('node server/index.js')) {
        console.log('✅ Render config has correct start command');
    } else {
        console.log('⚠️  Render config may need start command update');
    }
} catch (error) {
    console.log('❌ Error reading render.yaml');
}

// Check public/config.js
try {
    const configJsPath = path.join(projectRoot, 'public', 'config.js');
    const configJs = fs.readFileSync(configJsPath, 'utf8');
    if (configJs.includes('ai-coder-backend.onrender.com')) {
        console.log('✅ Frontend config has correct backend URL');
    } else {
        console.log('⚠️  Frontend config may need backend URL update');
    }
} catch (error) {
    console.log('❌ Error reading public/config.js');
}

// Final summary
console.log('\n📋 DEPLOYMENT READINESS SUMMARY');
console.log('===============================');

if (allFilesExist) {
    console.log('🎉 All required files and configurations are present!');
    console.log('\n✅ READY FOR DEPLOYMENT');
    console.log('\n🚀 Next steps:');
    console.log('1. Run: npm run deploy:render (or manual Render setup)');
    console.log('2. Run: npm run deploy:netlify (or manual Netlify setup)');
    console.log('3. Follow NETLIFY_RENDER_DEPLOYMENT.md guide');
    console.log('4. Use DEPLOYMENT_CHECKLIST.md for verification');
} else {
    console.log('❌ Some required files or configurations are missing.');
    console.log('\n🔧 Please run the setup scripts:');
    console.log('1. node scripts/setup-env-vars.js');
    console.log('2. Check NETLIFY_RENDER_DEPLOYMENT.md for manual setup');
}

console.log('\n📞 Support:');
console.log('- Documentation: NETLIFY_RENDER_DEPLOYMENT.md');
console.log('- Checklist: DEPLOYMENT_CHECKLIST.md');
console.log('- Environment setup: scripts/setup-env-vars.js');

console.log('\n🎯 Deployment Commands:');
console.log('- Backend: npm run deploy:render');
console.log('- Frontend: npm run deploy:netlify');
console.log('- Both: npm run deploy:all');
console.log('- PowerShell: .\\deploy-netlify-render.ps1');
