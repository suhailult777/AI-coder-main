// Test script to verify multi-agent functionality
// Main Agent (Gemini) creates code, Test Agent (Mistral Codestral) analyzes it
import fetch from 'node-fetch';

async function testMultiAgentSetup() {
    console.log('🧪 Testing Multi-Agent Setup (Gemini + Mistral)...\n');

    try {
        // First create a test user account or login
        console.log('📝 Creating test user...');
        const testEmail = 'test@example.com';
        const testPassword = 'testpass123';

        // Try to register (this will fail if user already exists, which is okay)
        const registerResponse = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword
            })
        });

        // Now try to login (this should work regardless of whether register succeeded)
        console.log('🔐 Logging in...');
        const loginResponse = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword
            })
        });

        if (!loginResponse.ok) {
            const loginError = await loginResponse.json();
            console.log('❌ Login failed:', loginError.error);
            return;
        }

        const loginResult = await loginResponse.json();
        console.log('✅ Login successful for:', loginResult.email);

        // Extract session cookie for subsequent requests
        const cookies = loginResponse.headers.get('set-cookie');
        if (!cookies) {
            console.log('❌ No session cookie received');
            return;
        }

        const sessionCookie = cookies
            .split(',')
            .find(cookie => cookie.trim().startsWith('connect.sid='))
            ?.split(';')[0]
            ?.trim();

        if (!sessionCookie) {
            console.log('❌ Could not extract session cookie');
            return;
        }

        console.log('🍪 Session cookie obtained\n');

        // STEP 1: Test the main agent (Gemini) - Create a project
        console.log('🤖 STEP 1: Testing Main Agent (Gemini)...');
        const agentResponse = await fetch('http://localhost:3000/api/agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            },
            body: JSON.stringify({
                prompt: 'Create a simple calculator web app with HTML, CSS, and JavaScript. Include basic arithmetic operations and a clean, modern design.'
            })
        });

        const agentResult = await agentResponse.json();

        if (!agentResponse.ok || !agentResult.success) {
            console.log('❌ Main Agent Test FAILED!');
            console.log('Error:', agentResult.error || agentResult.message);
            return;
        }

        console.log('✅ Main Agent (Gemini) - Project creation initiated!');
        console.log('📁 Project path:', agentResult.agentPath);

        // Wait a bit for the main agent to finish creating the project
        console.log('⏳ Waiting for main agent to complete...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

        // STEP 2: Test the test agent (Mistral Codestral) - Analyze the created project
        console.log('\n🧪 STEP 2: Testing Test Agent (Mistral Codestral)...');
        const testAgentResponse = await fetch('http://localhost:3000/api/test-agent/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            },
            body: JSON.stringify({
                code: 'analyze_latest_project' // This tells the test agent to analyze the latest project
            })
        });

        const testAgentResult = await testAgentResponse.json();

        if (!testAgentResponse.ok || !testAgentResult.success) {
            console.log('❌ Test Agent Test FAILED!');
            console.log('Error:', testAgentResult.error || testAgentResult.message);
            return;
        }

        console.log('✅ Test Agent (Mistral Codestral) - Analysis initiated!');

        // Wait for the test agent to complete analysis
        console.log('⏳ Waiting for test agent to complete analysis...');
        await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds

        console.log('\n🎉 MULTI-AGENT TEST COMPLETED!');
        console.log('📊 Main Agent (Gemini): Created project');
        console.log('🔍 Test Agent (Mistral): Analyzed project');
        console.log('📄 Check the project folder for the analysis report!');

    } catch (error) {
        console.log('💥 Multi-Agent Test Error:', error.message);
    }
}

// Run the test
testMultiAgentSetup();
