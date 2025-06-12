// Quick test to verify SSE functionality
const fs = require('fs');
const path = require('path');

const agentStatusPath = path.join(__dirname, 'agent', 'agent-status.json');

console.log('🧪 Testing SSE functionality...');
console.log('📁 Status file path:', agentStatusPath);

// Simulate a sequence of agent status updates
const statusSequence = [
    { status: 'starting', message: 'Agent initializing...', delay: 1000 },
    { status: 'thinking', message: 'Analyzing the request...', delay: 2000 },
    { status: 'executing', message: 'Running commands...', toolCall: { tool: 'executeCommand', input: 'npm init -y' }, delay: 3000 },
    { status: 'tool_completed', message: 'Command completed successfully', toolCall: { tool: 'executeCommand', input: 'npm init -y' }, toolResult: 'Package.json created successfully!', delay: 2000 },
    { status: 'finalizing', message: 'Finalizing project...', delay: 1000 },
    { status: 'completed', message: 'Project created successfully!', projectName: 'test-project', projectPath: '/path/to/test-project', delay: 0 }
];

function updateStatus(statusData) {
    const fullStatusData = {
        ...statusData,
        timestamp: new Date().toISOString(),
        sessionId: 'test-session-' + Date.now()
    };

    // Ensure agent directory exists
    const agentDir = path.dirname(agentStatusPath);
    if (!fs.existsSync(agentDir)) {
        fs.mkdirSync(agentDir, { recursive: true });
    }

    // Write status file
    fs.writeFileSync(agentStatusPath, JSON.stringify(fullStatusData, null, 2));
    console.log(`📊 Status: ${statusData.status} - ${statusData.message}`);
}

async function runTest() {
    console.log('🚀 Starting status sequence...');
    console.log('👀 Watch the SSE test page at: http://localhost:3000/test-sse.html');
    console.log('');

    for (const [index, statusUpdate] of statusSequence.entries()) {
        console.log(`Step ${index + 1}/${statusSequence.length}: ${statusUpdate.status}`);

        // Extract delay and create status data
        const { delay, ...statusData } = statusUpdate;
        updateStatus(statusData);

        // Wait before next update
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    console.log('');
    console.log('✅ Test sequence completed!');
    console.log('🔍 Check the SSE test page to verify all updates were received in real-time.');
}

// Run the test
runTest().catch(console.error);
