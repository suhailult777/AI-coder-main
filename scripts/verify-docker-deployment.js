#!/usr/bin/env node

/**
 * Docker Deployment Verification Script
 * Tests all functionality including agent mode, SSE streaming, and authentication
 */

import fetch from 'node-fetch';
import EventSource from 'eventsource';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test@docker-deployment.com';
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'Docker Test User';

console.log('🐳 Docker Deployment Verification');
console.log('================================');
console.log(`Testing backend at: ${BASE_URL}`);
console.log('');

let sessionCookie = '';

// Helper function to make authenticated requests
async function makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (sessionCookie) {
        headers['Cookie'] = sessionCookie;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    // Extract session cookie from response
    if (response.headers.get('set-cookie')) {
        sessionCookie = response.headers.get('set-cookie').split(';')[0];
    }

    return response;
}

// Test 1: Health Check
async function testHealthCheck() {
    console.log('🏥 Testing health check...');
    try {
        const response = await makeRequest('/api/health');
        const data = await response.json();

        if (response.ok && data.status === 'OK') {
            console.log('✅ Health check passed');
            console.log(`   Database: ${data.database.status}`);
            console.log(`   Environment: ${data.environment}`);
            return true;
        } else {
            console.log('❌ Health check failed:', data);
            return false;
        }
    } catch (error) {
        console.log('❌ Health check error:', error.message);
        return false;
    }
}

// Test 2: User Registration
async function testUserRegistration() {
    console.log('👤 Testing user registration...');
    try {
        const response = await makeRequest('/api/register', {
            method: 'POST',
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
                name: TEST_NAME
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ User registration successful');
            return true;
        } else if (response.status === 409) {
            console.log('✅ User already exists (expected)');
            return true;
        } else {
            console.log('❌ User registration failed:', data);
            return false;
        }
    } catch (error) {
        console.log('❌ User registration error:', error.message);
        return false;
    }
}

// Test 3: User Login
async function testUserLogin() {
    console.log('🔐 Testing user login...');
    try {
        const response = await makeRequest('/api/login', {
            method: 'POST',
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ User login successful');
            console.log(`   User: ${data.user.name} (${data.user.email})`);
            return true;
        } else {
            console.log('❌ User login failed:', data);
            return false;
        }
    } catch (error) {
        console.log('❌ User login error:', error.message);
        return false;
    }
}

// Test 4: Agent Mode (requires authentication)
async function testAgentMode() {
    console.log('🤖 Testing agent mode...');
    try {
        const response = await makeRequest('/api/agent', {
            method: 'POST',
            body: JSON.stringify({
                prompt: 'Create a simple hello world HTML file for Docker deployment test'
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ Agent mode activated successfully');
            console.log(`   Status: ${data.status}`);
            console.log(`   Message: ${data.message}`);
            return true;
        } else {
            console.log('❌ Agent mode failed:', data);
            return false;
        }
    } catch (error) {
        console.log('❌ Agent mode error:', error.message);
        return false;
    }
}

// Test 5: Agent Status
async function testAgentStatus() {
    console.log('📊 Testing agent status...');
    try {
        const response = await makeRequest('/api/agent/status');
        const data = await response.json();

        if (response.ok) {
            console.log('✅ Agent status retrieved successfully');
            console.log(`   Status: ${data.status}`);
            console.log(`   Message: ${data.message}`);
            return true;
        } else {
            console.log('❌ Agent status failed:', data);
            return false;
        }
    } catch (error) {
        console.log('❌ Agent status error:', error.message);
        return false;
    }
}

// Test 6: SSE Streaming
async function testSSEStreaming() {
    console.log('📡 Testing SSE streaming...');
    return new Promise((resolve) => {
        try {
            const eventSource = new EventSource(`${BASE_URL}/api/agent/status/stream`, {
                headers: {
                    'Cookie': sessionCookie
                }
            });

            let messageReceived = false;
            const timeout = setTimeout(() => {
                eventSource.close();
                if (!messageReceived) {
                    console.log('❌ SSE streaming timeout - no messages received');
                    resolve(false);
                }
            }, 5000);

            eventSource.onopen = () => {
                console.log('✅ SSE connection established');
            };

            eventSource.onmessage = (event) => {
                messageReceived = true;
                const data = JSON.parse(event.data);
                console.log('✅ SSE message received:', data.type);

                clearTimeout(timeout);
                eventSource.close();
                resolve(true);
            };

            eventSource.onerror = (error) => {
                console.log('❌ SSE streaming error:', error);
                clearTimeout(timeout);
                eventSource.close();
                resolve(false);
            };

        } catch (error) {
            console.log('❌ SSE streaming setup error:', error.message);
            resolve(false);
        }
    });
}

// Test 7: CORS Headers
async function testCORSHeaders() {
    console.log('🌐 Testing CORS headers...');
    try {
        const response = await makeRequest('/api/health', {
            method: 'OPTIONS'
        });

        const corsHeader = response.headers.get('access-control-allow-origin');
        const methodsHeader = response.headers.get('access-control-allow-methods');

        if (corsHeader && methodsHeader) {
            console.log('✅ CORS headers present');
            console.log(`   Origin: ${corsHeader}`);
            console.log(`   Methods: ${methodsHeader}`);
            return true;
        } else {
            console.log('❌ CORS headers missing');
            return false;
        }
    } catch (error) {
        console.log('❌ CORS test error:', error.message);
        return false;
    }
}

// Main verification function
async function runVerification() {
    console.log('Starting verification tests...\n');

    const tests = [
        { name: 'Health Check', fn: testHealthCheck },
        { name: 'User Registration', fn: testUserRegistration },
        { name: 'User Login', fn: testUserLogin },
        { name: 'Agent Mode', fn: testAgentMode },
        { name: 'Agent Status', fn: testAgentStatus },
        { name: 'SSE Streaming', fn: testSSEStreaming },
        { name: 'CORS Headers', fn: testCORSHeaders }
    ];

    const results = [];

    for (const test of tests) {
        console.log(`\n--- ${test.name} ---`);
        const result = await test.fn();
        results.push({ name: test.name, passed: result });

        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('\n🏁 Verification Summary');
    console.log('======================');

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${result.name}`);
    });

    console.log(`\nTotal: ${passed}/${total} tests passed`);

    if (passed === total) {
        console.log('🎉 All tests passed! Docker deployment is working correctly.');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Please check the deployment configuration.');
        process.exit(1);
    }
}

// Run verification
runVerification().catch(error => {
    console.error('💥 Verification script error:', error);
    process.exit(1);
});
