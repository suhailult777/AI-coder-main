const API_KEY = "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"; // Replace with your actual API key
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Global variables
let isAgentMode = false;
let userHasScrolled = false;

// Function to set the prompt textarea value
function setPrompt(text) {
    const promptTextarea = document.getElementById('prompt');
    if (promptTextarea) {
        promptTextarea.value = text;
        promptTextarea.focus(); // Optional: focus the textarea after setting value
    }
}

// Handle agent mode functionality
async function handleAgentMode(prompt, output, generateButton, copyButton, copyButtonSpan) {
    // Set agent mode flag
    isAgentMode = true;

    // --- Start: Feedback on button click ---
    if (generateButton) {
        generateButton.disabled = true;
        generateButton.textContent = 'Starting Agent...';
        generateButton.classList.add('generating');
    }
    // --- End: Feedback on button click ---

    // Reset copy button state
    if (copyButtonSpan) {
        copyButtonSpan.textContent = 'Copy';
        copyButton.classList.remove('copied');
    }

    // Clear existing content
    output.className = '';
    output.removeAttribute('data-highlighted');

    // Hide test button since we're starting fresh
    hideTestButton();

    // Show agent mode loading animation
    output.innerHTML = `
        <div class="loading-container agent-loading">
            <span>🤖 Activating Agent Mode</span>
            <span class="loading-dot">.</span>
            <span class="loading-dot">.</span>
            <span class="loading-dot">.</span>
        </div>
    `;

    try {
        // Check authentication before proceeding
        if (!window.currentUser) {
            output.innerHTML = `
                <div class="auth-required-message">
                    <div class="auth-icon">🔒</div>
                    <h3>Authentication Required</h3>
                    <p>Please sign in to access Agent Mode - our premium AI coding assistant.</p>
                    <button class="auth-action-btn" onclick="document.getElementById('authModal').classList.add('active'); document.body.style.overflow = 'hidden';">
                        Sign In
                    </button>
                </div>
            `;
            if (generateButton) {
                generateButton.disabled = false;
                generateButton.textContent = 'Enter';
                generateButton.classList.remove('generating');
            }
            return;
        }

        // Make sure we have a prompt
        if (!prompt || prompt.trim() === '') {
            output.innerHTML = `<span class="error-message">Please enter a prompt before activating agent mode.</span>`;
            if (generateButton) {
                generateButton.disabled = false;
                generateButton.textContent = 'Enter';
                generateButton.classList.remove('generating');
            }
            return;
        }

        // Send request to agent mode endpoint
        const response = await fetch('/api/agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();

        if (!response.ok) {
            // Authentication errors no longer expected since auth is disabled for serverless compatibility
            throw new Error(data.error || 'Agent mode activation failed');
        }

        // Show simple agent stream interface
        output.innerHTML = `
            <div class="agent-stream">
                <div class="stream-header">
                    <span class="stream-title">
                        🤖 AI Agent Working
                        <span class="connection-indicator connecting" id="connection-indicator" title="Connection Status"></span>
                    </span>
                    <span class="stream-status">ACTIVE</span>
                </div>
                <div class="stream-content" id="stream-content">
                    <div class="stream-line">
                        <span class="stream-timestamp">${new Date().toLocaleTimeString()}</span>
                        <span class="stream-text">🚀 Agent activated: "${prompt}"</span>
                    </div>
                    <div class="stream-line">
                        <span class="stream-timestamp">${new Date().toLocaleTimeString()}</span>
                        <span class="stream-text">📁 Working in: ${data.agentPath}</span>
                    </div>
                    <div class="stream-line current-line" id="current-line">
                        <span class="stream-timestamp">${new Date().toLocaleTimeString()}</span>
                        <span class="stream-text">🔄 ${data.message}</span>
                        <span class="cursor">●</span>
                    </div>
                </div>
            </div>
        `;

        // Start SSE streaming for real-time status updates
        startAgentStatusStreaming();

    } catch (error) {
        console.error('Agent mode error:', error);
        output.innerHTML = `<span class="error-message">Error activating agent mode: ${error.message}</span>`;
    } finally {
        // --- Start: Restore button state ---
        if (generateButton) {
            generateButton.disabled = false;
            generateButton.textContent = 'Enter';
            generateButton.classList.remove('generating');
        }
        // --- End: Restore button state ---
    }
}

// Function to start SSE connection for real-time agent status updates
let agentEventSource = null;

function updateConnectionIndicator(status) {
    const indicator = document.getElementById('connection-indicator');
    if (indicator) {
        indicator.className = 'connection-indicator ' + status;
        switch (status) {
            case 'connected':
                indicator.title = 'Connected - Real-time updates active';
                break;
            case 'connecting':
                indicator.title = 'Connecting to server...';
                break;
            case 'disconnected':
                indicator.title = 'Disconnected - Attempting to reconnect...';
                break;
        }
    }
}

// Function to show test button with animation (only if there's content to test)
function showTestButton() {
    // Only show test button in agent mode
    if (!isAgentMode) {
        console.log('Not in agent mode, hiding test button');
        hideTestButton();
        return;
    }

    // Check if there's actual content generated by the agent
    const agentOutput = document.getElementById('agentOutput');
    const hasContent = agentOutput && agentOutput.textContent.trim().length > 0;

    // Only show test button if there's content to test
    if (!hasContent) {
        console.log('No content to test, hiding test button');
        hideTestButton();
        return;
    }

    const testButtonContainer = document.getElementById('testButtonContainer');
    if (testButtonContainer) {
        // First make it visible but transparent
        testButtonContainer.style.display = 'block';
        testButtonContainer.style.opacity = '0';
        testButtonContainer.style.transform = 'translateY(20px)';

        // Animate in
        setTimeout(() => {
            testButtonContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            testButtonContainer.style.opacity = '1';
            testButtonContainer.style.transform = 'translateY(0)';
        }, 100);
    }
}

// Function to hide test button
function hideTestButton() {
    const testButtonContainer = document.getElementById('testButtonContainer');
    if (testButtonContainer) {
        testButtonContainer.style.display = 'none';
    }
}

let testAgentEventSource = null;

// Function to handle test button click
async function handleTestAppButtonClick() {
    const testButton = document.getElementById('testAppButton');
    if (testButton) {
        testButton.disabled = true;
        testButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running Tests...';

        // Clear previous test results and show container
        const outputContainer = document.getElementById('testAgentOutputContainer');
        const outputElement = document.getElementById('testAgentOutput');
        outputElement.textContent = '';
        outputContainer.style.display = 'block';

        const agentOutputCode = document.getElementById('agentOutput').textContent;

        try {
            const response = await fetch('/api/test-agent/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: agentOutputCode || "No code found to test." }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to start test agent: ${errorText}`);
            }

            const result = await response.json();
            console.log(result.message);
            startTestAgentStatusStreaming(); // Start listening for updates

        } catch (error) {
            console.error('Error starting test agent:', error);
            testButton.innerHTML = 'Test Failed';
            testButton.disabled = false;
            outputElement.textContent = `Error: ${error.message}`;
        }
    }
}

function startTestAgentStatusStreaming() {
    if (testAgentEventSource) {
        testAgentEventSource.close();
    }

    const outputContainer = document.getElementById('testAgentOutputContainer');
    const statusElement = outputContainer.querySelector('.stream-status');
    statusElement.textContent = 'RUNNING';
    statusElement.className = 'stream-status status-running';

    testAgentEventSource = new EventSource('/api/test-agent/status/stream');

    testAgentEventSource.onopen = function (event) {
        console.log('🔌 Test Agent SSE connection opened');
    };

    testAgentEventSource.onmessage = function (event) {
        const data = JSON.parse(event.data);
        const outputElement = document.getElementById('testAgentOutput');
        const testButton = document.getElementById('testAppButton');

        let content = `[${new Date(data.timestamp).toLocaleTimeString()}] ${data.status.toUpperCase()}: ${data.message}\n`;

        // Add detailed information based on the step
        if (data.step === 'found-files' && data.files) {
            content += `  📁 Files found:\n`;
            data.files.forEach(file => {
                content += `    - ${file.name} (${file.extension})\n`;
            });
        } else if (data.step === 'analyzing-file' && data.fileContent) {
            content += `  📄 File preview:\n`;
            content += `  ${data.fileContent.split('\n').map(line => '    ' + line).join('\n')}\n`;
            if (data.progress) {
                content += `  📊 Progress: ${data.progress}%\n`;
            }
        } else if (data.step === 'file-complete' && data.analysisPreview) {
            content += `  ✅ Analysis preview:\n`;
            content += `  ${data.analysisPreview.split('\n').map(line => '    ' + line).join('\n')}\n`;
        } else if (data.step === 'file-error') {
            content += `  ❌ Error: ${data.error}\n`;
        }

        if (data.toolCall) {
            content += `  🔧 Tool Call: ${data.toolCall.tool}(${JSON.stringify(data.toolCall.input)})\n`;
        }
        if (data.toolResult) {
            content += `  📋 Tool Result: ${data.toolResult}\n`;
        }

        outputElement.textContent += content;
        const streamOutput = outputElement.parentElement;
        streamOutput.scrollTop = streamOutput.scrollHeight;

        // Update progress indicator if available
        if (data.progress) {
            updateTestProgress(data.progress);
        }

        if (data.status === 'completed' || data.status === 'error') {
            testAgentEventSource.close();
            console.log('🔌 Test Agent SSE connection closed');
            if (testButton) {
                testButton.disabled = false;
                if (data.status === 'completed') {
                    statusElement.textContent = 'COMPLETED';
                    statusElement.className = 'stream-status status-completed';
                    testButton.innerHTML = '<i class="fas fa-check"></i> Tests Complete';
                    testButton.style.background = 'linear-gradient(135deg, #4caf50, #2e7d32)';

                    // Fetch and display the test analysis report
                    fetchTestAnalysisReport();
                } else {
                    statusElement.textContent = 'ERROR';
                    statusElement.className = 'stream-status status-error';
                    testButton.innerHTML = 'Test Failed';
                    testButton.style.background = 'linear-gradient(135deg, #f44336, #b71c1c)';
                }
            }
            // Hide progress bar when done
            hideTestProgress();
        }
    };

    testAgentEventSource.onerror = function (event) {
        console.error('SSE error:', event);
        testAgentEventSource.close();
        statusElement.textContent = 'ERROR';
        statusElement.className = 'stream-status status-error';
        const testButton = document.getElementById('testAppButton');
        if (testButton) {
            testButton.innerHTML = 'Test Error';
            testButton.disabled = false;
        }
    };
}

function startAgentStatusStreaming() {
    if (agentEventSource) {
        agentEventSource.close();
        agentEventSource = null;
    }

    console.log('🔌 Starting SSE connection for agent status...');
    updateConnectionIndicator('connecting');

    agentEventSource = new EventSource('/api/agent/status/stream');

    agentEventSource.onopen = function (event) {
        console.log('🔌 SSE connection opened');
        updateConnectionIndicator('connected');
    };

    agentEventSource.onmessage = function (event) {
        try {
            const data = JSON.parse(event.data);
            updateAgentStatusDisplay(data);

            if (['completed', 'error'].includes(data.status)) {
                console.log('🔌 Agent completed, closing SSE connection');
                agentEventSource.close();
                agentEventSource = null;
                updateConnectionIndicator('disconnected');

                if (data.status === 'completed') {
                    showTestButton();
                }
            }
        } catch (error) {
            console.error('Error parsing SSE message:', error);
        }
    };

    agentEventSource.onerror = function (event) {
        console.error('🔌 SSE connection error:', event);
        updateConnectionIndicator('disconnected');
        if (agentEventSource.readyState === EventSource.CLOSED) {
            agentEventSource = null;
        }
    };
}

function stopAgentStatusStreaming() {
    if (agentEventSource) {
        console.log('🔌 Closing SSE connection...');
        agentEventSource.close();
        agentEventSource = null;
        updateConnectionIndicator('disconnected');
    }
}

function updateAgentStatusDisplay(statusData) {
    const streamContent = document.getElementById('stream-content');
    const currentLine = document.getElementById('current-line');
    const streamStatus = document.querySelector('.stream-status');

    if (!streamContent || !currentLine) return;

    // Check if statusData is just a string message
    if (typeof statusData === 'string') {
        const currentText = currentLine.querySelector('.stream-text');
        if (currentText) {
            currentText.textContent = `✅ ${statusData}`;
        }
        return;
    }

    // Handle object-based status updates
    const currentText = currentLine.querySelector('.stream-text');
    if (currentText && statusData.message) {
        let statusIcon = '🔄';
        let displayMessage = statusData.message;
        const status = statusData.status || 'processing';

        switch (status) {
            case 'starting': statusIcon = '🚀'; break;
            case 'thinking': 
                statusIcon = '🧠'; 
                displayMessage = `AI thinking: ${statusData.message}`;
                break;
            case 'executing':
                statusIcon = '⚡';
                if (statusData.toolCall) {
                    displayMessage = `Executing tool: ${statusData.toolCall.tool}`;
                    // Add tool details in a new line
                    addToolCallDetails(statusData.toolCall);
                }
                break;
            case 'creating':
                statusIcon = '📝';
                if (statusData.action === 'create_directory') {
                    displayMessage = `Creating directory: ${statusData.directoryName || statusData.path}`;
                } else if (statusData.action === 'create_file') {
                    const fileName = statusData.fileName || statusData.path;
                    const fileType = statusData.fileType || 'file';
                    displayMessage = `Writing ${fileType}: ${fileName}`;

                    // Add detailed file creation info with code preview
                    if (statusData.fileContent) {
                        addFileCreationDetails(statusData);
                    }
                }
                break;
            case 'file_created':
                statusIcon = '📄';
                const fileName = statusData.fileName || statusData.path;
                const fileType = statusData.fileType || 'File';
                displayMessage = `✅ ${fileType} created: ${fileName}`;
                if (statusData.fileSize) {
                    displayMessage += ` (${statusData.fileSize} chars, ${statusData.linesOfCode} lines)`;
                }
                break;
            case 'directory_created':
                statusIcon = '📁';
                displayMessage = `✅ Directory created: ${statusData.directoryName || statusData.path}`;
                break;
            case 'tool_completed':
                statusIcon = '✅';
                if (statusData.toolCall) {
                    displayMessage = `Completed: ${statusData.toolCall.tool}`;
                    // Show tool result if available
                    if (statusData.toolResult) {
                        addToolResultDetails(statusData.toolCall, statusData.toolResult);
                    }
                }
                break;
            case 'completed': statusIcon = '🎉'; break;
            case 'error': statusIcon = '❌'; break;
        }
        
        currentText.textContent = `${statusIcon} ${displayMessage}`;
        
        // Update timestamp
        const timestamp = currentLine.querySelector('.stream-timestamp');
        if (timestamp) {
            timestamp.textContent = new Date().toLocaleTimeString();
        }
    }

    if (streamStatus && statusData.status) {
        streamStatus.textContent = statusData.status.replace('_', ' ').toUpperCase();
        streamStatus.className = `stream-status status-${statusData.status}`;
    }
}

// Function to add file content preview to the stream
function addFileContentPreview(filePath, content) {
    const streamContent = document.getElementById('stream-content');
    if (!streamContent) return;

    // Create a file preview element
    const previewElement = document.createElement('div');
    previewElement.className = 'file-preview';
    previewElement.style.cssText = `
        margin: 10px 0;
        background: #0f0f0f;
        border: 1px solid #333;
        border-radius: 8px;
        overflow: hidden;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        background: #1a1a1a;
        padding: 8px 12px;
        font-size: 12px;
        color: #ccc;
        border-bottom: 1px solid #333;
        font-weight: bold;
    `;
    header.textContent = `📄 ${filePath}`;

    const codeContent = document.createElement('pre');
    codeContent.style.cssText = `
        margin: 0;
        padding: 12px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 11px;
        line-height: 1.4;
        color: #e0e0e0;
        white-space: pre-wrap;
        word-wrap: break-word;
        max-height: 200px;
        overflow-y: auto;
    `;
    codeContent.textContent = content;

    previewElement.appendChild(header);
    previewElement.appendChild(codeContent);

    // Insert before the current line
    const currentLine = document.getElementById('current-line');
    if (currentLine) {
        streamContent.insertBefore(previewElement, currentLine);
    } else {
        streamContent.appendChild(previewElement);
    }

    // Auto-scroll to show the new content
    if (!userHasScrolled) {
        previewElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
}

// Function to add detailed file creation information
function addFileCreationDetails(fileData) {
    const streamContent = document.getElementById('stream-content');
    if (!streamContent) return;

    // Create a file preview container for the stream
    const filePreviewContainer = document.createElement('div');
    filePreviewContainer.className = 'stream-line file-creation';
    filePreviewContainer.style.cssText = `
        margin: 10px 0;
        border: 1px solid #333;
        border-radius: 8px;
        background: #0a0a0a;
        overflow: hidden;
        font-family: 'Consolas', monospace;
    `;

    // File header
    const fileHeader = document.createElement('div');
    fileHeader.className = 'file-header';
    fileHeader.style.cssText = `
        background: #1a1a1a;
        padding: 8px 12px;
        border-bottom: 1px solid #333;
        color: #e0e0e0;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    // File type icon and info
    const fileTypeIcon = getFileTypeIcon(fileData.fileExtension);
    const fileStats = `${fileData.contentLength || 0} chars • ${fileData.linesOfCode || 0} lines`;
    
    fileHeader.innerHTML = `
        <span class="stream-timestamp" style="color: #888; margin-right: 10px;">${new Date().toLocaleTimeString()}</span>
        <span style="font-size: 16px;">${fileTypeIcon}</span>
        <span style="color: #4fc3f7;">📝 Creating: ${fileData.fileName}</span>
        <span style="color: #888; margin-left: auto; font-size: 12px;">${fileStats}</span>
    `;

    // File content preview
    const fileContent = document.createElement('pre');
    fileContent.className = 'file-content-preview';
    fileContent.style.cssText = `
        margin: 0;
        padding: 12px;
        background: #0f0f0f;
        color: #e0e0e0;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.4;
        overflow-x: auto;
        white-space: pre;
        border: none;
        max-height: 300px;
        overflow-y: auto;
    `;

    // Show file content with syntax highlighting
    const contentToShow = fileData.fileContent || fileData.contentPreview || '';
    if (contentToShow) {
        const highlightedContent = applySyntaxHighlighting(contentToShow, fileData.fileExtension);
        fileContent.innerHTML = highlightedContent;
    } else {
        fileContent.textContent = '(Empty file)';
        fileContent.style.color = '#666';
    }

    // Add expand/collapse for long content
    const shouldTruncate = contentToShow.length > 800;
    if (shouldTruncate) {
        const previewContent = contentToShow.substring(0, 400) + '\n\n... (content truncated, click to expand)';
        fileContent.innerHTML = applySyntaxHighlighting(previewContent, fileData.fileExtension);
        fileContent.style.cursor = 'pointer';
        fileContent.title = 'Click to expand/collapse';
        
        let isExpanded = false;
        fileContent.onclick = () => {
            if (isExpanded) {
                fileContent.innerHTML = applySyntaxHighlighting(previewContent, fileData.fileExtension);
                isExpanded = false;
            } else {
                fileContent.innerHTML = applySyntaxHighlighting(contentToShow, fileData.fileExtension);
                isExpanded = true;
            }
        };
    }

    filePreviewContainer.appendChild(fileHeader);
    filePreviewContainer.appendChild(fileContent);

    // Insert before current line in stream
    const currentLine = document.getElementById('current-line');
    streamContent.insertBefore(filePreviewContainer, currentLine);

    // Scroll to bottom
    const streamContainer = streamContent.parentElement;
    if (streamContainer) {
        streamContainer.scrollTop = streamContainer.scrollHeight;
    }
}

// Helper function to get file type icon
function getFileTypeIcon(extension) {
    const icons = {
        'html': '🌐',
        'css': '🎨',
        'js': '⚡',
        'json': '📋',
        'md': '📝',
        'txt': '📄',
        'py': '🐍',
        'java': '☕',
        'cpp': '⚙️',
        'c': '⚙️',
        'ts': '🔷',
        'jsx': '⚛️',
        'tsx': '⚛️'
    };
    return icons[extension] || '📄';
}

// Basic syntax highlighting function
function applySyntaxHighlighting(code, extension) {
    if (!code) return '';

    let highlightedCode = code;

    // Escape HTML first
    highlightedCode = highlightedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    switch (extension) {
        case 'html':
            // HTML tags
            highlightedCode = highlightedCode.replace(/(&lt;\/?[^&\s]+(?:\s[^&]*?)?&gt;)/g, '<span style="color: #f92672;">$1</span>');
            // Attributes
            highlightedCode = highlightedCode.replace(/(\w+)=/g, '<span style="color: #a6e22e;">$1</span>=');
            // Strings
            highlightedCode = highlightedCode.replace(/"([^"]*?)"/g, '<span style="color: #e6db74;">"$1"</span>');
            break;

        case 'css':
            // Selectors
            highlightedCode = highlightedCode.replace(/^([^{]+){/gm, '<span style="color: #a6e22e;">$1</span>{');
            // Properties
            highlightedCode = highlightedCode.replace(/(\w+):/g, '<span style="color: #66d9ef;">$1</span>:');
            // Values
            highlightedCode = highlightedCode.replace(/:\s*([^;]+);/g, ': <span style="color: #e6db74;">$1</span>;');
            break;

        case 'js':
            // Keywords
            highlightedCode = highlightedCode.replace(/\b(function|const|let|var|if|else|for|while|return|class|extends|import|export|from|async|await)\b/g, '<span style="color: #f92672;">$1</span>');
            // Strings
            highlightedCode = highlightedCode.replace(/'([^']*?)'/g, '<span style="color: #e6db74;">\'$1\'</span>');
            highlightedCode = highlightedCode.replace(/"([^"]*?)"/g, '<span style="color: #e6db74;">"$1"</span>');
            // Comments
            highlightedCode = highlightedCode.replace(/\/\/.*$/gm, '<span style="color: #75715e;">$&</span>');
            break;

        case 'json':
            // Keys
            highlightedCode = highlightedCode.replace(/"([^"]+)":/g, '<span style="color: #a6e22e;">"$1"</span>:');
            // String values
            highlightedCode = highlightedCode.replace(/:\s*"([^"]+)"/g, ': <span style="color: #e6db74;">"$1"</span>');
            // Numbers
            highlightedCode = highlightedCode.replace(/:\s*(\d+(?:\.\d+)?)/g, ': <span style="color: #ae81ff;">$1</span>');
            // Booleans
            highlightedCode = highlightedCode.replace(/:\s*(true|false|null)/g, ': <span style="color: #66d9ef;">$1</span>');
            break;
    }

    return highlightedCode;
}


async function generateCode() {
    userHasScrolled = false;
    const prompt = document.getElementById('prompt').value;
    isAgentMode = document.body.classList.contains('agent-mode');

    let outputContainer, output, copyButton, copyButtonSpan;
    if (isAgentMode) {
        outputContainer = document.getElementById('agentModeOutput');
        output = document.getElementById('agentOutput');
        copyButton = document.getElementById('agentCopyButton');
        const normalOutputContainer = document.getElementById('normalModeOutput');
        if (normalOutputContainer) normalOutputContainer.style.display = 'none';
    } else {
        outputContainer = document.getElementById('normalModeOutput');
        output = document.getElementById('normalOutput');
        copyButton = document.getElementById('normalCopyButton');
        const agentOutputContainer = document.getElementById('agentModeOutput');
        if (agentOutputContainer) agentOutputContainer.style.display = 'none';
    }

    copyButtonSpan = copyButton ? copyButton.querySelector('span') : null;
    const generateButton = document.getElementById('generateButton');
    const modelSelect = isAgentMode ? document.getElementById('agent-model-select') : document.getElementById('model-select');

    if (outputContainer) outputContainer.style.display = 'block';

    if (isAgentMode) {
        return handleAgentMode(prompt, output, generateButton, copyButton, copyButtonSpan);
    }

    // This is the original, non-agent mode logic
    const selectedModel = modelSelect ? modelSelect.value : "google/gemini-2.0-flash-exp:free";

    if (generateButton) {
        generateButton.disabled = true;
        generateButton.textContent = 'Generating...';
        generateButton.classList.add('generating');
    }

    if (copyButtonSpan) {
        copyButtonSpan.textContent = 'Copy';
        copyButton.classList.remove('copied');
    }

    output.className = '';
    output.removeAttribute('data-highlighted');

    // Hide test button since we're starting fresh
    hideTestButton();

    output.innerHTML = `<div class="loading-container"><span>🤖 Generating code...</span></div>`;

    try {
        if (!prompt || prompt.trim() === '') {
            output.innerHTML = `<span class="error-message">Please enter a prompt.</span>`;
            if (generateButton) {
                generateButton.disabled = false;
                generateButton.textContent = 'Enter';
                generateButton.classList.remove('generating');
            }
            return;
        }

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.href,
                "X-Title": "AI Coder"
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [{ role: "user", content: `Write code for: ${prompt}` }],
                max_tokens: 2000,
                temperature: 0.3,
                top_p: 0.95,
                stream: true
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`API Error (${response.status}): ${errorData || 'Unknown error'}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let firstChunkReceived = false;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            if (!firstChunkReceived && chunk.trim().length > 0) {
                output.innerHTML = '';
                firstChunkReceived = true;
            }

            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataContent = line.substring(6).trim();
                    if (dataContent === '[DONE]') break;
                    try {
                        const jsonData = JSON.parse(dataContent);
                        if (jsonData.choices && jsonData.choices[0].delta && jsonData.choices[0].delta.content) {
                            fullContent += jsonData.choices[0].delta.content;
                            output.innerHTML += jsonData.choices[0].delta.content;
                            if (!userHasScrolled) {
                                const preElement = output.parentElement;
                                preElement.scrollTop = preElement.scrollHeight;
                            }
                        }
                    } catch (e) { /* Ignore parsing errors */ }
                }
            }
        }

        if (fullContent.length > 0) {
            output.textContent = fullContent;
            let language = 'plaintext';
            const codeBlockMatch = fullContent.match(/^```(\w+)/);
            if (codeBlockMatch) language = codeBlockMatch[1];
            output.className = `language-${language}`;
            if (typeof hljs !== 'undefined') {
                hljs.highlightElement(output);
            }
        }

    } catch (error) {
        output.innerHTML = `<span class="error-message">Error: ${error.message}</span>`;
    } finally {
        if (generateButton) {
            generateButton.disabled = false;
            generateButton.textContent = 'Enter';
            generateButton.classList.remove('generating');
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const testAppButton = document.getElementById('testAppButton');
    if (testAppButton) {
        testAppButton.addEventListener('click', handleTestAppButtonClick);
    }
    // Test console log to ensure script is loading
    console.log('Script loaded successfully!');

    // Add beforeunload event to cleanup SSE connections
    window.addEventListener('beforeunload', function () {
        stopAgentStatusStreaming();
    });

    // Add page visibility change handler to manage SSE connections
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            // Page is hidden, keep connection but don't reconnect if it fails
        } else {
            // Page is visible, ensure connection is active if needed
            if (!agentEventSource && isAgentMode) {
                startAgentStatusStreaming();
            }
        }
    });
    console.log('Current time:', new Date());

    // Initialize syntax highlighting if needed (assuming hljs is loaded)
    if (typeof hljs !== 'undefined') {
        // If you want to highlight existing code on load, uncomment the next line
        // hljs.highlightAll();
    }

    // Add event listener for model selection change
    const normalModeModelSelect = document.getElementById('model-select');
    const agentModeModelSelect = document.getElementById('agent-model-select');

    if (normalModeModelSelect) {
        // Set initial state based on default selection
        updateGeminiModelClass();
        // Update when model changes
        normalModeModelSelect.addEventListener('change', updateGeminiModelClass);
    }

    if (agentModeModelSelect) {
        // Update when agent model changes (all are Gemini so always add class)
        agentModeModelSelect.addEventListener('change', updateGeminiModelClass);
    }

    // Function to update body class based on selected model
    function updateGeminiModelClass() {
        const currentMode = isAgentMode;
        let selectedModel;

        if (currentMode) {
            // Agent mode - get from agent model selector
            const agentModelSelect = document.getElementById('agent-model-select');
            selectedModel = agentModelSelect ? agentModelSelect.value : '';
        } else {
            // Normal mode - get from normal model selector
            const normalModelSelect = document.getElementById('model-select');
            selectedModel = normalModelSelect ? normalModelSelect.value : '';
        }

        // Check if the selected model is a Gemini model
        if (selectedModel.includes('google/gemini')) {
            document.body.classList.add('gemini-model-selected');
        } else {
            document.body.classList.remove('gemini-model-selected');
        }
    }

    // Add event listener for Enter key in the prompt textarea
    const promptTextarea = document.getElementById('prompt');
    if (promptTextarea) {
        promptTextarea.addEventListener('keydown', function (event) {
            // Check if Enter key was pressed without Shift (Shift+Enter allows for newlines)
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Prevent default behavior (newline)
                generateCode(); // Call the generate function
            }
        });
    }

    // Add scroll event listener to detect manual scrolling for both output containers
    function setupScrollTracking(outputElementId) {
        const outputElement = document.getElementById(outputElementId);
        if (outputElement && outputElement.parentElement) {
            const preElement = outputElement.parentElement;
            preElement.addEventListener('scroll', function () {
                // Check if this is a manual scroll during code generation
                // We determine this by checking if the scroll position is not at the bottom
                const isAtBottom = preElement.scrollHeight - preElement.scrollTop <= preElement.clientHeight + 10; // 10px tolerance

                // If we're not at the bottom during generation, user has manually scrolled
                if (!isAtBottom && outputElement.innerHTML.includes('loading-container') === false) {
                    userHasScrolled = true;
                }
            });

            // Reset scroll tracking when user scrolls back to bottom
            preElement.addEventListener('scroll', function () {
                const isAtBottom = preElement.scrollHeight - preElement.scrollTop <= preElement.clientHeight + 10;
                if (isAtBottom) {
                    // If user manually scrolls back to bottom, resume auto-scrolling
                    userHasScrolled = false;
                }
            });
        }
    }

    // Setup scroll tracking for both output containers
    setupScrollTracking('normalOutput');
    setupScrollTracking('agentOutput');

    // Side Navigation functionality
    const openNavBtn = document.getElementById('openNav');
    const closeNavBtn = document.getElementById('closeNav');
    const sideNav = document.getElementById('mySidenav');
    const overlay = document.getElementById('overlay');

    // Open side navigation
    if (openNavBtn) {
        openNavBtn.addEventListener('click', function () {
            sideNav.classList.add('open');
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when nav is open
        });
    }

    // Close side navigation
    if (closeNavBtn) {
        closeNavBtn.addEventListener('click', closeNav);
    }

    // Close nav when clicking on overlay
    if (overlay) {
        overlay.addEventListener('click', closeNav);
    }

    // Function to close the side navigation
    function closeNav() {
        sideNav.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Close side nav when window is resized to desktop size
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768 && sideNav.classList.contains('open')) {
            closeNav();
        }
    });

    // Copy button functionality - Updated to handle both Normal and Agent mode copy buttons
    function setupCopyButton(copyButtonId, outputElementId) {
        const copyButton = document.getElementById(copyButtonId);
        const outputCodeElement = document.getElementById(outputElementId);

        if (copyButton && outputCodeElement) {
            copyButton.addEventListener('click', function () {
                const codeToCopy = outputCodeElement.textContent;
                if (codeToCopy) {
                    navigator.clipboard.writeText(codeToCopy).then(() => {
                        // Success feedback
                        const buttonSpan = copyButton.querySelector('span');
                        buttonSpan.textContent = 'Copied!';
                        copyButton.classList.add('copied');

                        // Reset button after 2 seconds
                        setTimeout(() => {
                            buttonSpan.textContent = 'Copy';
                            copyButton.classList.remove('copied');
                        }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy code: ', err);
                        // Optional: Provide error feedback on the button
                        const buttonSpan = copyButton.querySelector('span');
                        buttonSpan.textContent = 'Error';
                        setTimeout(() => {
                            buttonSpan.textContent = 'Copy';
                        }, 2000);
                    });
                } else {
                    console.warn('No code to copy.');
                }
            });
        }
    }

    // Setup copy buttons for both Normal and Agent modes
    setupCopyButton('normalCopyButton', 'normalOutput');
    setupCopyButton('agentCopyButton', 'agentOutput');

    // --- Theme Toggle Logic ---
    const themeToggleButton = document.getElementById('themeToggle');
    const bodyElement = document.body;
    const lightThemeIcon = '☀️';
    const darkThemeIcon = '🌙';
    // Link to the highlight.js light theme (replace with your preferred one)
    const lightHljsThemeUrl = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github.min.css';
    const darkHljsThemeUrl = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/vs2015.min.css';
    const hljsThemeLink = document.querySelector('link[href*="highlight.js/styles"]');

    // Function to set theme
    function setTheme(isLight) {
        if (isLight) {
            bodyElement.classList.add('light-theme');
            themeToggleButton.textContent = darkThemeIcon;
            if (hljsThemeLink) hljsThemeLink.href = lightHljsThemeUrl;
            localStorage.setItem('theme', 'light');
        } else {
            bodyElement.classList.remove('light-theme');
            themeToggleButton.textContent = lightThemeIcon;
            if (hljsThemeLink) hljsThemeLink.href = darkHljsThemeUrl;
            localStorage.setItem('theme', 'dark');
        }
    }

    // Check local storage for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

    // Initialize theme based on saved preference or system preference
    if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
        setTheme(true);
    } else {
        setTheme(false); // Default to dark
    }


    // Add click listener to the button
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            const isCurrentlyLight = bodyElement.classList.contains('light-theme');
            setTheme(!isCurrentlyLight);
        });
    }
    // --- End Theme Toggle Logic ---

    // --- Agent Mode Toggle Logic ---
    const agentModeToggleButton = document.getElementById('agentModeToggle');
    const agentModeIndicator = document.getElementById('agentModeIndicator');
    const normalModePrompts = document.getElementById('normalModePrompts');
    const agentModePrompts = document.getElementById('agentModePrompts');
    const normalModeIcon = '🤖';
    const agentModeIcon = '🚀';

    // Function to set agent mode
    function setAgentMode(enableAgentMode) {
        const normalModeModelSelector = document.getElementById('normalModeModelSelector');
        const agentModeModelSelector = document.getElementById('agentModeModelSelector');
        const normalModeOutput = document.getElementById('normalModeOutput');
        const agentModeOutput = document.getElementById('agentModeOutput');

        // Update global variable
        isAgentMode = enableAgentMode;

        if (enableAgentMode) {
            bodyElement.classList.add('agent-mode');
            agentModeToggleButton.classList.add('active');
            agentModeToggleButton.textContent = agentModeIcon;
            agentModeToggleButton.title = 'Switch to Normal Mode';
            localStorage.setItem('agentMode', 'true');

            // Show agent mode indicator
            if (agentModeIndicator) {
                agentModeIndicator.style.display = 'inline-block';
            }

            // Switch example prompts
            if (normalModePrompts) normalModePrompts.style.display = 'none';
            if (agentModePrompts) agentModePrompts.style.display = 'block';

            // Switch model selectors - Show Agent Mode (Gemini only), Hide Normal Mode
            if (normalModeModelSelector) normalModeModelSelector.style.display = 'none';
            if (agentModeModelSelector) agentModeModelSelector.style.display = 'flex';

            // Switch output containers - Show Agent Mode Output, Hide Normal Mode Output
            if (normalModeOutput) normalModeOutput.style.display = 'none';
            if (agentModeOutput) agentModeOutput.style.display = 'none'; // Both hidden initially until code is generated

            // Update main heading to indicate agent mode
            const mainHeading = document.querySelector('h1');
            if (mainHeading && !mainHeading.textContent.includes('Agent Mode')) {
                mainHeading.textContent = 'The AI-Powered Code Editor - Agent Mode';
            }

            // Update description for agent mode
            const description = document.querySelector('.main-content p');
            if (description) {
                description.textContent = 'Experience autonomous AI coding with enhanced capabilities, intelligent code generation, and advanced problem-solving features.';
            }

            // Update textarea placeholder for agent mode
            const promptTextarea = document.getElementById('prompt');
            if (promptTextarea) {
                promptTextarea.placeholder = 'Describe complex systems, architectures, or advanced coding challenges you want the AI to build (e.g., "Build a full-stack e-commerce platform with payment integration", "Create a distributed system with microservices").';
            }

        } else {
            bodyElement.classList.remove('agent-mode');
            agentModeToggleButton.classList.remove('active');
            agentModeToggleButton.textContent = normalModeIcon;
            agentModeToggleButton.title = 'Switch to Agent Mode';
            localStorage.setItem('agentMode', 'false');

            // Hide test button when leaving agent mode
            hideTestButton();

            // Hide agent mode indicator
            if (agentModeIndicator) {
                agentModeIndicator.style.display = 'none';
            }

            // Switch example prompts back to normal
            if (normalModePrompts) normalModePrompts.style.display = 'block';
            if (agentModePrompts) agentModePrompts.style.display = 'none';

            // Switch model selectors - Show Normal Mode (All models), Hide Agent Mode
            if (normalModeModelSelector) normalModeModelSelector.style.display = 'flex';
            if (agentModeModelSelector) agentModeModelSelector.style.display = 'none';

            // Switch output containers - Show Normal Mode Output, Hide Agent Mode Output
            if (normalModeOutput) normalModeOutput.style.display = 'none';
            if (agentModeOutput) agentModeOutput.style.display = 'none'; // Both hidden initially

            // Reset main heading
            const mainHeading = document.querySelector('h1');
            if (mainHeading) {
                mainHeading.textContent = 'The AI-Powered Code Editor';
            }

            // Reset description
            const description = document.querySelector('.main-content p');
            if (description) {
                description.textContent = 'Supercharge your coding workflow with AI-powered code generation, now featuring Google Gemini 2.0 Flash.';
            }

            // Reset textarea placeholder
            const promptTextarea = document.getElementById('prompt');
            if (promptTextarea) {
                promptTextarea.placeholder = 'Describe the code you\'d like the AI to write (e.g., "a function to sort an array in JavaScript", "HTML for a simple contact form", "Python code to calculate the Fibonacci sequence").';
            }
        }
    }

    // Check local storage for saved agent mode preference
    const savedAgentMode = localStorage.getItem('agentMode');

    // Initialize agent mode based on saved preference, but only if user is authenticated
    // If user is not authenticated and tries to use agent mode, it will be handled by the toggle button
    if (savedAgentMode === 'true') {
        // We'll check authentication status first and then set agent mode if appropriate
        // This will be handled in checkAuthStatus function
    } else {
        setAgentMode(false);
    }

    // Add click listener to the agent mode toggle button
    if (agentModeToggleButton) {
        agentModeToggleButton.addEventListener('click', (e) => {
            e.preventDefault();

            // Check authentication before allowing agent mode
            if (!window.currentUser) {
                // Store intention to activate agent mode
                localStorage.setItem('pendingAgentMode', 'true');

                // Show auth modal with specific message about agent mode
                if (authModal) {
                    authModal.classList.add('active');
                    document.body.style.overflow = 'hidden';

                    // Show agent-specific authentication message
                    showAuthError('Please sign in to access Agent Mode - our premium AI coding assistant.', false);

                    // Focus on auth modal
                    setTimeout(() => {
                        const firstFocusable = authModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                        if (firstFocusable) {
                            firstFocusable.focus();
                        }
                        trapFocus(authModal);
                    }, 150);
                }
                return;
            }

            // User is authenticated, allow agent mode toggle
            const isCurrentlyAgentMode = bodyElement.classList.contains('agent-mode');
            setAgentMode(!isCurrentlyAgentMode);
        });
    }
    // --- End Agent Mode Toggle Logic ---

    // --- Auth Modal Logic ---
    console.log('Setting up auth modal...'); // Debug log
    const signInButton = document.getElementById('signInButton');
    const authModal = document.getElementById('authModal');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authTabContents = document.querySelectorAll('.auth-tab-content');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const googleAuthBtn = document.getElementById('googleAuthBtn');
    const authError = document.getElementById('authError');

    console.log('Sign In Button:', signInButton); // Debug log
    console.log('Auth Modal:', authModal); // Debug log

    // Open auth modal
    if (signInButton) {
        signInButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Sign In button clicked!'); // Debug log
            console.log('Auth modal element:', authModal); // Debug log

            // Show the modal
            authModal.classList.add('active'); // Use class to control visibility and opacity
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            // Focus first element when modal opens, with a slight delay for transition
            setTimeout(() => {
                const firstFocusable = authModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
                trapFocus(authModal); // Apply focus trapping
            }, 150); // Delay should be similar to CSS transition time
        });
    }

    // Close auth modal
    function closeModal() {
        authModal.classList.remove('active'); // Use class to control visibility and opacity
        document.body.style.overflow = ''; // Restore scrolling
        clearAuthErrors();
        // Optionally, return focus to the button that opened the modal
        if (document.activeElement === authModal || authModal.contains(document.activeElement)) {
            if (signInButton) signInButton.focus();
            else if (mobileSignInButton) mobileSignInButton.focus();
        }
    }

    if (closeAuthModal) {
        closeAuthModal.addEventListener('click', closeModal);
    }

    // Close modal when clicking outside
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            closeModal();
        }
    });

    // Handle tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active content
            authTabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetTab}Tab`) {
                    content.classList.add('active');
                }
            });

            clearAuthErrors();
        });
    });

    // Form validation functions
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validatePassword(password) {
        return password && password.length >= 6;
    }

    function getPasswordStrength(password) {
        if (!password) return { strength: 0, text: 'Enter a password' };
        if (password.length < 6) return { strength: 1, text: 'Too short' };
        if (password.length < 8) return { strength: 2, text: 'Weak' };

        let score = 2;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score >= 5) return { strength: 4, text: 'Strong' };
        if (score >= 4) return { strength: 3, text: 'Good' };
        return { strength: 2, text: 'Fair' };
    }

    function showFieldError(fieldId, message) {
        const errorElement = document.getElementById(`${fieldId}Error`);
        const inputElement = document.getElementById(fieldId);

        if (errorElement) {
            errorElement.textContent = message;
        }
        if (inputElement) {
            inputElement.classList.add('error');
        }
    }

    function clearFieldError(fieldId) {
        const errorElement = document.getElementById(`${fieldId}Error`);
        const inputElement = document.getElementById(fieldId);

        if (errorElement) {
            errorElement.textContent = '';
        }
        if (inputElement) {
            inputElement.classList.remove('error');
        }
    }

    function clearAuthErrors() {
        // Clear all field errors
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
        });

        // Hide auth error alert
        authError.style.display = 'none';
    }

    function switchToLoginTab(email = '') {
        // Find and activate the login tab
        const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
        const registerTab = document.querySelector('.auth-tab[data-tab="register"]');
        const loginTabContent = document.getElementById('loginTab');
        const registerTabContent = document.getElementById('registerTab');

        if (loginTab && registerTab && loginTabContent && registerTabContent) {
            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            loginTab.classList.add('active');

            // Add highlight effect to draw attention to the tab switch
            loginTab.classList.add('highlight');
            setTimeout(() => {
                loginTab.classList.remove('highlight');
            }, 600);

            // Update active content
            authTabContents.forEach(content => content.classList.remove('active'));
            loginTabContent.classList.add('active');

            // Pre-fill email if provided
            if (email) {
                const loginEmailInput = document.getElementById('loginEmail');
                if (loginEmailInput) {
                    loginEmailInput.value = email;
                    // Focus on password field since email is already filled
                    const loginPasswordInput = document.getElementById('loginPassword');
                    if (loginPasswordInput) {
                        setTimeout(() => {
                            loginPasswordInput.focus();
                            // Add a subtle highlight to the password field
                            loginPasswordInput.style.boxShadow = '0 0 0 2px rgba(66, 133, 244, 0.3)';
                            setTimeout(() => {
                                loginPasswordInput.style.boxShadow = '';
                            }, 1000);
                        }, 300);
                    }
                }
            }

            // Clear any existing errors
            clearAuthErrors();

            // Show a helpful message with the user's email
            setTimeout(() => {
                const message = email
                    ? `Welcome! Your account (${email}) is ready. Please enter your password to log in.`
                    : 'Your account is ready! Please enter your credentials to log in.';
                showAuthError(message, true);
            }, 400);
        }
    }

    function showAuthError(message, isSuccess = false) {
        const errorText = authError.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = message;
            authError.className = isSuccess ? 'auth-error success' : 'auth-error';
            authError.style.display = 'flex';
        }
    }

    function setButtonLoading(button, isLoading) {
        const btnText = button.querySelector('.btn-text');
        const btnLoader = button.querySelector('.btn-loader');

        if (isLoading) {
            button.classList.add('loading'); // Add loading class for spinner visibility
            button.disabled = true;
        } else {
            button.classList.remove('loading'); // Remove loading class
            button.disabled = false;
        }
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthErrors();

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const submitBtn = loginForm.querySelector('.auth-submit-btn');

            let hasErrors = false;

            // Validate email
            if (!email) {
                showFieldError('loginEmail', 'Email is required');
                hasErrors = true;
            } else if (!validateEmail(email)) {
                showFieldError('loginEmail', 'Invalid email address');
                hasErrors = true;
            } else {
                clearFieldError('loginEmail');
            }

            // Validate password
            if (!password) {
                showFieldError('loginPassword', 'Password is required');
                hasErrors = true;
            } else {
                clearFieldError('loginPassword');
            }

            if (hasErrors) return;

            // Real login process
            setButtonLoading(submitBtn, true);

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Login failed');
                }

                // Store user data
                window.currentUser = data;
                updateUIForLoggedInUser(data);

                // Check if user was trying to access agent mode before login
                const pendingAgentMode = localStorage.getItem('pendingAgentMode');
                if (pendingAgentMode === 'true') {
                    localStorage.removeItem('pendingAgentMode');
                    setAgentMode(true);
                    showAuthError('Welcome to Agent Mode! You now have access to our premium AI coding assistant.', true);
                } else {
                    showAuthError('Login successful! Welcome back.', true);
                }

                setTimeout(() => {
                    closeModal();
                }, 1500);

            } catch (error) {
                console.error('Login error:', error);
                showAuthError(error.message || 'Login failed. Please try again.');
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    }

    // Handle register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthErrors();

            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const submitBtn = registerForm.querySelector('.auth-submit-btn');

            let hasErrors = false;

            // Validate email
            if (!email) {
                showFieldError('registerEmail', 'Email is required');
                hasErrors = true;
            } else if (!validateEmail(email)) {
                showFieldError('registerEmail', 'Invalid email address');
                hasErrors = true;
            } else {
                clearFieldError('registerEmail');
            }

            // Validate password
            if (!password) {
                showFieldError('registerPassword', 'Password is required');
                hasErrors = true;
            } else if (!validatePassword(password)) {
                showFieldError('registerPassword', 'Password must be at least 6 characters');
                hasErrors = true;
            } else {
                clearFieldError('registerPassword');
            }

            // Validate confirm password
            if (!confirmPassword) {
                showFieldError('confirmPassword', 'Please confirm your password');
                hasErrors = true;
            } else if (password !== confirmPassword) {
                showFieldError('confirmPassword', 'Passwords do not match');
                hasErrors = true;
            } else {
                clearFieldError('confirmPassword');
            }

            if (hasErrors) return;

            // Real registration process
            setButtonLoading(submitBtn, true);

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Registration failed');
                }

                // Clear the registration form
                registerForm.reset();

                // Check if user was trying to access agent mode before registration
                const pendingAgentMode = localStorage.getItem('pendingAgentMode');
                if (pendingAgentMode === 'true') {
                    showAuthError('Account created successfully! Please log in to access Agent Mode.', true);
                } else {
                    showAuthError('Account created successfully! Please log in with your new credentials.', true);
                }

                // Switch to login tab after a brief delay
                setTimeout(() => {
                    switchToLoginTab(email);
                }, 1500);

            } catch (error) {
                console.error('Registration error:', error);
                showAuthError(error.message || 'Registration failed. Please try again.');
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    }

    // Handle Google authentication
    if (googleAuthBtn) {
        googleAuthBtn.addEventListener('click', async () => {
            clearAuthErrors();

            try {
                googleAuthBtn.style.opacity = '0.7';
                googleAuthBtn.disabled = true;

                // Import Firebase functions dynamically
                const { mockGoogleSignIn } = await import('./firebase-config.js');

                // Use mock Google sign-in for demo (replace with real Firebase in production)
                const user = await mockGoogleSignIn();
                const idToken = await user.getIdToken();

                // Send token to backend for verification
                const response = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ idToken })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Google authentication failed');
                }

                // Store user data
                window.currentUser = data;
                updateUIForLoggedInUser(data);

                // Agent mode no longer requires authentication
                showAuthError('Google authentication successful! Welcome to AI-SuperProductivity.', true);

                setTimeout(() => {
                    closeModal();
                }, 1500);

            } catch (error) {
                console.error('Google auth error:', error);
                showAuthError(error.message || 'Google authentication failed. Please try again.');
            } finally {
                googleAuthBtn.style.opacity = '1';
                googleAuthBtn.disabled = false;
            }
        });
    }

    // Handle Enter key navigation between form fields
    function setupFormNavigation() {
        // Login form navigation
        const loginEmail = document.getElementById('loginEmail');
        const loginPassword = document.getElementById('loginPassword');

        if (loginEmail && loginPassword) {
            loginEmail.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    loginPassword.focus();
                }
            });
        }

        // Register form navigation
        const registerEmail = document.getElementById('registerEmail');
        const registerPassword = document.getElementById('registerPassword');
        const confirmPassword = document.getElementById('confirmPassword');

        if (registerEmail && registerPassword) {
            registerEmail.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    registerPassword.focus();
                }
            });
        }

        if (registerPassword && confirmPassword) {
            registerPassword.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmPassword.focus();
                }
            });
        }
    }

    setupFormNavigation();

    // Clear errors when user starts typing
    function setupErrorClearing() {
        const inputs = document.querySelectorAll('.auth-form input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                const fieldId = input.id;
                clearFieldError(fieldId);

                // Also hide the general auth error when user starts correcting
                if (authError.style.display === 'flex') {
                    authError.style.display = 'none';
                }
            });
        });
    }

    setupErrorClearing();

    // Setup password strength indicator
    function setupPasswordStrength() {
        const passwordInput = document.getElementById('registerPassword');
        const strengthIndicator = document.getElementById('passwordStrength');
        const strengthFill = strengthIndicator?.querySelector('.strength-fill');
        const strengthText = strengthIndicator?.querySelector('.strength-text');

        if (passwordInput && strengthIndicator && strengthFill && strengthText) {
            passwordInput.addEventListener('input', () => {
                const password = passwordInput.value;
                const strength = getPasswordStrength(password);

                if (password.length > 0) {
                    strengthIndicator.style.display = 'block';
                    strengthFill.className = `strength-fill strength-${strength.strength}`;
                    strengthText.textContent = strength.text;
                } else {
                    strengthIndicator.style.display = 'none';
                }
            });
        }
    }

    setupPasswordStrength();

    // Handle Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && authModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Focus management for accessibility
    function trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });

        // Focus first element when modal opens
        if (firstElement) {
            firstElement.focus();
        }
    }

    // Apply focus trapping when modal opens via desktop button
    // signInButton.addEventListener('click', () => { // This listener is now combined with the open logic
    // setTimeout(() => {
    // trapFocus(authModal);
    // }, 100);
    // });

    // Handle mobile sign in button
    const mobileSignInButton = document.getElementById('mobileSignInButton');
    console.log('Mobile Sign In Button:', mobileSignInButton); // Debug log
    if (mobileSignInButton) {
        mobileSignInButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Mobile Sign In button clicked!'); // Debug log
            // Close mobile menu first using the existing closeNav function
            closeNav();

            // Then open auth modal
            authModal.classList.add('active'); // Use class to control visibility and opacity
            document.body.style.overflow = 'hidden';

            // Focus first element when modal opens, with a slight delay for transition
            setTimeout(() => {
                const firstFocusable = authModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
                trapFocus(authModal); // Apply focus trapping
            }, 150); // Delay should be similar to CSS transition time
        });
    }
    // --- End Auth Modal Logic ---

    // --- User State Management ---

    // Function to update UI when user is logged in
    function updateUIForLoggedInUser(user) {
        // Update sign in button to show user info or logout option
        if (signInButton) {
            signInButton.textContent = 'Logout';
            signInButton.onclick = handleLogout;
        }

        // Update mobile sign in button
        if (mobileSignInButton) {
            mobileSignInButton.textContent = 'Logout';
            mobileSignInButton.onclick = handleLogout;
        }

        // Update agent mode toggle button to show it's available
        if (agentModeToggleButton) {
            agentModeToggleButton.title = 'Toggle Agent Mode';
            agentModeToggleButton.classList.remove('auth-required');
        }

        console.log('User logged in:', user);
    }

    // Function to update UI when user is logged out
    function updateUIForLoggedOutUser() {
        if (signInButton) {
            signInButton.textContent = 'Sign In';
            signInButton.onclick = (e) => {
                e.preventDefault();
                authModal.classList.add('active');
                document.body.style.overflow = 'hidden';
                setTimeout(() => {
                    const firstFocusable = authModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                    if (firstFocusable) {
                        firstFocusable.focus();
                    }
                    trapFocus(authModal);
                }, 150);
            };
        }

        if (mobileSignInButton) {
            mobileSignInButton.textContent = 'Sign In';
            mobileSignInButton.onclick = (e) => {
                e.preventDefault();
                closeNav();
                authModal.classList.add('active');
                document.body.style.overflow = 'hidden';
                setTimeout(() => {
                    const firstFocusable = authModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                    if (firstFocusable) {
                        firstFocusable.focus();
                    }
                    trapFocus(authModal);
                }, 150);
            };
        }

        // Update agent mode toggle button to show authentication requirement
        if (agentModeToggleButton) {
            agentModeToggleButton.title = 'Agent Mode (Sign In Required)';
            agentModeToggleButton.classList.add('auth-required');
        }

        window.currentUser = null;
        console.log('User logged out');
    }

    // Handle logout
    async function handleLogout(e) {
        e.preventDefault();

        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                updateUIForLoggedOutUser();

                // Disable agent mode on logout
                const isCurrentlyAgentMode = bodyElement.classList.contains('agent-mode');
                if (isCurrentlyAgentMode) {
                    setAgentMode(false);
                }

                // Optional: Show logout success message
                console.log('Logged out successfully');
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Check if user is already logged in on page load
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/user', {
                credentials: 'include'
            });

            if (response.ok) {
                const user = await response.json();
                window.currentUser = user;
                updateUIForLoggedInUser(user);

                // Check if agent mode should be enabled (only if authenticated)
                const savedAgentMode = localStorage.getItem('agentMode');
                if (savedAgentMode === 'true') {
                    setAgentMode(true);
                }
            } else {
                updateUIForLoggedOutUser();
                // Disable agent mode if not authenticated
                setAgentMode(false);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            updateUIForLoggedOutUser();
            // Disable agent mode on authentication error
            setAgentMode(false);
        }
    }

    // Check auth status on page load
    checkAuthStatus();

}); // End DOMContentLoaded

// Function to fetch and display test analysis report
async function fetchTestAnalysisReport() {
    try {
        const response = await fetch('/api/test-agent/report');
        if (!response.ok) {
            console.warn('No test analysis report found');
            return;
        }

        const reportData = await response.json();
        if (reportData.success) {
            displayTestAnalysisReport(reportData);
        }
    } catch (error) {
        console.error('Error fetching test analysis report:', error);
    }
}

// Function to display test analysis report in the UI
function displayTestAnalysisReport(reportData) {
    const outputElement = document.getElementById('testAgentOutput');

    // Add a separator and the report
    const reportHeader = `\n\n${'='.repeat(60)}\n📄 TEST ANALYSIS REPORT\n${'='.repeat(60)}\n`;
    const reportContent = `Project: ${reportData.projectName}\nGenerated: ${new Date(reportData.timestamp).toLocaleString()}\n\n${reportData.reportContent}`;

    outputElement.textContent += reportHeader + reportContent;

    // Scroll to bottom
    const streamOutput = outputElement.parentElement;
    streamOutput.scrollTop = streamOutput.scrollHeight;

    // Also create a button to view the full report in a modal
    createReportViewButton(reportData);
}

// Function to create a button to view the full report
function createReportViewButton(reportData) {
    const testButton = document.getElementById('testAppButton');
    if (!testButton) return;

    // Create a "View Report" button next to the test button
    let viewReportBtn = document.getElementById('viewReportButton');
    if (!viewReportBtn) {
        viewReportBtn = document.createElement('button');
        viewReportBtn.id = 'viewReportButton';
        viewReportBtn.style.cssText = `
            margin-left: 10px;
            padding: 8px 16px;
            background: linear-gradient(135deg, #2196f3, #1976d2);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'SF Pro Display', -apple-system, system-ui, sans-serif;
            font-weight: 500;
            transition: all 0.3s ease;
        `;
        testButton.parentNode.appendChild(viewReportBtn);
    }

    viewReportBtn.innerHTML = '<i class="fas fa-file-alt"></i> View Full Report';
    viewReportBtn.onclick = () => showReportModal(reportData);
}

// Function to show report in a modal
function showReportModal(reportData) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('reportModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'reportModal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            z-index: 10000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
            backdrop-filter: blur(5px);
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: #1a1a1a;
            margin: 2% auto;
            padding: 20px;
            border-radius: 12px;
            width: 90%;
            max-height: 90%;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            border: 1px solid #333;
        `;

        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            margin-top: -10px;
        `;
        closeBtn.onclick = () => modal.style.display = 'none';

        const reportContainer = document.createElement('pre');
        reportContainer.id = 'modalReportContent';
        reportContainer.style.cssText = `
            color: #e0e0e0;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
            background: #0f0f0f;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #333;
            margin-top: 20px;
        `;

        modalContent.appendChild(closeBtn);
        modalContent.appendChild(document.createElement('h2')).textContent = 'Test Analysis Report';
        modalContent.querySelector('h2').style.color = '#fff';
        modalContent.appendChild(reportContainer);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    // Update content and show
    const reportContainer = document.getElementById('modalReportContent');
    reportContainer.textContent = reportData.reportContent;
    modal.style.display = 'block';

    // Close modal when clicking outside
    modal.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Progress indicator functions for test agent
function updateTestProgress(percentage) {
    let progressBar = document.getElementById('testProgressBar');
    if (!progressBar) {
        // Create progress bar if it doesn't exist
        progressBar = createTestProgressBar();
    }

    const progressFill = progressBar.querySelector('.progress-fill');
    const progressText = progressBar.querySelector('.progress-text');

    progressFill.style.width = percentage + '%';
    progressText.textContent = `${percentage}%`;

    progressBar.style.display = 'block';
}

function createTestProgressBar() {
    const outputContainer = document.getElementById('testAgentOutputContainer');
    if (!outputContainer) return null;

    const progressBar = document.createElement('div');
    progressBar.id = 'testProgressBar';
    progressBar.style.cssText = `
        display: none;
        margin: 10px 0;
        background: #333;
        border-radius: 10px;
        overflow: hidden;
        height: 20px;
        position: relative;
    `;

    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.cssText = `
        height: 100%;
        background: linear-gradient(90deg, #4caf50, #2e7d32);
        transition: width 0.3s ease;
        width: 0%;
    `;

    const progressText = document.createElement('span');
    progressText.className = 'progress-text';
    progressText.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 12px;
        font-weight: bold;
    `;

    progressBar.appendChild(progressFill);
    progressBar.appendChild(progressText);

    // Insert before the output element
    const outputElement = document.getElementById('testAgentOutput');
    outputContainer.insertBefore(progressBar, outputElement.parentElement);

    return progressBar;
}

function hideTestProgress() {
    const progressBar = document.getElementById('testProgressBar');
    if (progressBar) {
        progressBar.style.display = 'none';
    }
}

// Function to add tool call details to the stream
function addToolCallDetails(toolCall) {
    const streamContent = document.getElementById('stream-content');
    if (!streamContent) return;

    const toolElement = document.createElement('div');
    toolElement.className = 'stream-line tool-call';
    toolElement.style.cssText = `
        margin: 5px 0;
        padding: 8px 12px;
        background: rgba(33, 150, 243, 0.1);
        border-left: 3px solid #2196f3;
        border-radius: 4px;
        font-family: 'Consolas', monospace;
        font-size: 13px;
    `;
    
    toolElement.innerHTML = `
        <span class="stream-timestamp" style="color: #888; margin-right: 10px;">${new Date().toLocaleTimeString()}</span>
        <span style="color: #2196f3;">🔧</span>
        <span style="color: #e0e0e0; margin-left: 8px;">Tool: <strong>${toolCall.tool}</strong></span>
        <div style="margin-top: 5px; color: #ccc; font-size: 12px;">
            Input: <code style="background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 3px;">${JSON.stringify(toolCall.input)}</code>
        </div>
    `;
    
    // Insert before current line
    const currentLine = document.getElementById('current-line');
    streamContent.insertBefore(toolElement, currentLine);
    
    // Scroll to bottom
    const streamContainer = streamContent.parentElement;
    if (streamContainer) {
        streamContainer.scrollTop = streamContainer.scrollHeight;
    }
}

// Function to add tool result details to the stream
function addToolResultDetails(toolCall, toolResult) {
    const streamContent = document.getElementById('stream-content');
    if (!streamContent) return;

    const resultElement = document.createElement('div');
    resultElement.className = 'stream-line tool-result';
    resultElement.style.cssText = `
        margin: 5px 0;
        padding: 8px 12px;
        background: rgba(76, 175, 80, 0.1);
        border-left: 3px solid #4caf50;
        border-radius: 4px;
        font-family: 'Consolas', monospace;
        font-size: 13px;
    `;
    
    // Truncate long results
    const truncatedResult = toolResult.length > 200 ? 
        toolResult.substring(0, 200) + '...' : toolResult;
    
    resultElement.innerHTML = `
        <span class="stream-timestamp" style="color: #888; margin-right: 10px;">${new Date().toLocaleTimeString()}</span>
        <span style="color: #4caf50;">📋</span>
        <span style="color: #e0e0e0; margin-left: 8px;">Result from <strong>${toolCall.tool}</strong></span>
        <div style="margin-top: 5px; color: #ccc; font-size: 12px; max-height: 100px; overflow-y: auto;">
            <pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">${truncatedResult}</pre>
        </div>
    `;
    
    // Insert before current line
    const currentLine = document.getElementById('current-line');
    streamContent.insertBefore(resultElement, currentLine);
    
    // Scroll to bottom
    const streamContainer = streamContent.parentElement;
    if (streamContainer) {
        streamContainer.scrollTop = streamContainer.scrollHeight;
    }
}
