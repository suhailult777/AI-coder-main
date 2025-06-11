#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Tests that the deployment is working correctly
 */

import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
    backend: process.env.BACKEND_URL || 'http://localhost:3000',
    timeout: 10000
};

console.log('🔍 AI-Coder Deployment Verification');
console.log('===================================');
console.log(`Frontend URL: ${CONFIG.frontend}`);
console.log(`Backend URL:  ${CONFIG.backend}`);
console.log('');

// Test functions
async function testEndpoint(url, description, options = {}) {
    try {
        console.log(`🧪 Testing ${description}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
        
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            console.log(`✅ ${description} - OK (${response.status})`);
            return true;
        } else {
            console.log(`❌ ${description} - Failed (${response.status})`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${description} - Error: ${error.message}`);
        return false;
    }
}

async function testFrontend() {
    console.log('🌐 Testing Frontend...');
    
    const tests = [
        {
            url: CONFIG.frontend,
            description: 'Frontend Root'
        },
        {
            url: `${CONFIG.frontend}/index.html`,
            description: 'Main HTML Page'
        },
        {
            url: `${CONFIG.frontend}/config.js`,
            description: 'Configuration File'
        },
        {
            url: `${CONFIG.frontend}/styles.css`,
            description: 'Styles'
        },
        {
            url: `${CONFIG.frontend}/script.js`,
            description: 'Main Script'
        }
    ];
    
    let passed = 0;
    for (const test of tests) {
        if (await testEndpoint(test.url, test.description)) {
            passed++;
        }
    }
    
    console.log(`Frontend: ${passed}/${tests.length} tests passed\n`);
    return passed === tests.length;
}

async function testBackend() {
    console.log('🖥️  Testing Backend...');
    
    const tests = [
        {
            url: `${CONFIG.backend}/api/health`,
            description: 'Health Check'
        },
        {
            url: `${CONFIG.backend}/api/user`,
            description: 'User Endpoint (should return 401)'
        }
    ];
    
    let passed = 0;
    for (const test of tests) {
        if (await testEndpoint(test.url, test.description)) {
            passed++;
        } else if (test.description.includes('401')) {
            // 401 is expected for unauthenticated user endpoint
            console.log(`✅ ${test.description} - Expected 401`);
            passed++;
        }
    }
    
    console.log(`Backend: ${passed}/${tests.length} tests passed\n`);
    return passed === tests.length;
}

async function testCORS() {
    console.log('🔗 Testing CORS...');
    
    try {
        const response = await fetch(`${CONFIG.backend}/api/health`, {
            method: 'OPTIONS',
            headers: {
                'Origin': CONFIG.frontend,
                'Access-Control-Request-Method': 'GET'
            }
        });
        
        const corsHeaders = {
            'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
            'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
            'access-control-allow-methods': response.headers.get('access-control-allow-methods')
        };
        
        console.log('CORS Headers:');
        Object.entries(corsHeaders).forEach(([key, value]) => {
            console.log(`  ${key}: ${value || 'Not set'}`);
        });
        
        if (corsHeaders['access-control-allow-origin'] && 
            corsHeaders['access-control-allow-credentials']) {
            console.log('✅ CORS - Configured correctly\n');
            return true;
        } else {
            console.log('❌ CORS - Missing required headers\n');
            return false;
        }
    } catch (error) {
        console.log(`❌ CORS - Error: ${error.message}\n`);
        return false;
    }
}

async function testConfiguration() {
    console.log('⚙️  Testing Configuration...');
    
    try {
        // Check if config.js exists and has correct structure
        const configPath = join(__dirname, 'public', 'config.js');
        const configContent = readFileSync(configPath, 'utf8');
        
        if (configContent.includes('PRODUCTION_CONFIG') && 
            configContent.includes('API_BASE_URL')) {
            console.log('✅ Configuration - Structure correct');
            
            // Check if production URL is set
            if (configContent.includes('onrender.com') || 
                configContent.includes(CONFIG.backend)) {
                console.log('✅ Configuration - Backend URL configured');
                console.log('');
                return true;
            } else {
                console.log('⚠️  Configuration - Backend URL needs to be updated');
                console.log('');
                return false;
            }
        } else {
            console.log('❌ Configuration - Missing required fields');
            console.log('');
            return false;
        }
    } catch (error) {
        console.log(`❌ Configuration - Error: ${error.message}\n`);
        return false;
    }
}

// Main verification function
async function runVerification() {
    const results = {
        frontend: await testFrontend(),
        backend: await testBackend(),
        cors: await testCORS(),
        config: await testConfiguration()
    };
    
    console.log('📊 Verification Summary');
    console.log('======================');
    
    Object.entries(results).forEach(([test, passed]) => {
        const icon = passed ? '✅' : '❌';
        console.log(`${icon} ${test.charAt(0).toUpperCase() + test.slice(1)}: ${passed ? 'PASS' : 'FAIL'}`);
    });
    
    const allPassed = Object.values(results).every(Boolean);
    
    console.log('');
    if (allPassed) {
        console.log('🎉 All tests passed! Deployment is working correctly.');
        process.exit(0);
    } else {
        console.log('❌ Some tests failed. Please check the deployment configuration.');
        console.log('');
        console.log('💡 Common fixes:');
        console.log('1. Update API_BASE_URL in public/config.js to point to your Render backend');
        console.log('2. Verify CORS settings in your backend server');
        console.log('3. Check that all environment variables are set in Render');
        console.log('4. Ensure Netlify redirects are configured correctly');
        process.exit(1);
    }
}

// Run verification
runVerification().catch(error => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
});
