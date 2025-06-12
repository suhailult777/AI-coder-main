// Test script to verify the integrated agent mode functionality
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

async function testIntegratedAgent() {
    console.log('🧪 Testing Integrated Agent Mode...\n');

    try {
        // Test the agent directly with the same setup as the server
        const agentPath = path.join(process.cwd(), 'agent');
        console.log(`📁 Agent path: ${agentPath}`);

        // Check if agent directory exists
        if (!fs.existsSync(agentPath)) {
            throw new Error('Agent directory not found');
        }

        console.log('✅ Agent directory exists');

        // Check if agent index.js exists
        const agentIndexPath = path.join(agentPath, 'index.js');
        if (!fs.existsSync(agentIndexPath)) {
            throw new Error('Agent index.js not found');
        }

        console.log('✅ Agent index.js exists');

        // Test environment variables
        const envPath = path.join(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) {
            throw new Error('.env file not found');
        }

        console.log('✅ .env file exists');

        // Test that we can spawn the agent process (same as server does)
        console.log('🚀 Testing agent spawn process...');

        const testPrompt = 'Create a simple test HTML file';
        const agentProcess = spawn('node', ['index.js'], {
            cwd: agentPath,
            shell: true,
            stdio: 'pipe',
            env: { ...process.env, USER_PROMPT: testPrompt }
        });

        let agentOutput = '';
        let agentError = '';
        let testPassed = false;

        agentProcess.stdout.on('data', (data) => {
            const output = data.toString();
            agentOutput += output;
            console.log('🤖 Agent output:', output.trim());

            // Check for success indicators
            if (output.includes('Task completed')) {
                testPassed = true;
            }
        });

        agentProcess.stderr.on('data', (data) => {
            const error = data.toString();
            agentError += error;
            if (error.trim()) {
                console.error('❌ Agent error:', error.trim());
            }
        });

        // Wait for process to complete with timeout
        const processPromise = new Promise((resolve, reject) => {
            agentProcess.on('close', (code) => {
                console.log(`🏁 Agent process exited with code ${code}`);
                if (code === 0 && testPassed) {
                    resolve('success');
                } else {
                    reject(new Error(`Agent process failed with code ${code}`));
                }
            });

            agentProcess.on('error', (error) => {
                reject(error);
            });
        });

        // Timeout after 30 seconds
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Agent test timeout')), 30000);
        });

        await Promise.race([processPromise, timeoutPromise]);

        console.log('\n✅ INTEGRATION TEST PASSED!');
        console.log('🎉 Agent mode is successfully integrated into AI-coder-main');

        // Clean up any test files
        const testFiles = ['index.html', 'agent-status.json'];
        testFiles.forEach(file => {
            const filePath = path.join(agentPath, file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🧹 Cleaned up test file: ${file}`);
            }
        });

    } catch (error) {
        console.error('❌ INTEGRATION TEST FAILED!');
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the test
testIntegratedAgent();
