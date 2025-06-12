// Test script to verify agent mode functionality
import fetch from 'node-fetch';

async function testAgentMode() {
    console.log('🧪 Testing Agent Mode Integration...\n');

    try {
        const response = await fetch('http://localhost:3000/api/agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: 'Create a simple calculator HTML page with CSS styling'
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Agent Mode Test PASSED!');
            console.log('Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('❌ Agent Mode Test FAILED!');
            console.log('Error:', data.error);
        }
    } catch (error) {
        console.log('💥 Test Error:', error.message);
    }
}

// Run the test
testAgentMode();
