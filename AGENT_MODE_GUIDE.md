# Agent Mode Implementation Guide

## Overview

This document describes the implementation of agentic capabilities in the AI-coder project. The agent mode allows users to submit complex coding requests through the web interface, which are then processed by an autonomous AI agent that can take actions to fulfill the requests.

## Architecture

### Components

1. **Web Interface (AI-coder-main)**

   - Agent mode toggle in the UI
   - Modified `generateCode()` function to detect agent mode
   - Agent-specific styling and user feedback
   - Backend API endpoint for agent requests

2. **AI Agent (my-cursor - agent mode)**

   - Gemini-powered autonomous coding agent
   - Command execution capabilities
   - VSCode integration
   - Structured thinking workflow (START, THINK, ACTION, OBSERVE, OUTPUT)

3. **Integration Layer**
   - Server endpoint `/api/agent` for handling agent requests
   - VSCode auto-opening functionality
   - Process management for the agent

## How It Works

### User Flow

1. User toggles to **Agent Mode** in the web interface
2. User enters a complex coding request (e.g., "Build a complete REST API with authentication")
3. User clicks "Enter" to submit the request
4. System automatically:
   - Opens a new VSCode window with the agent project
   - Starts the AI agent with the user's query
   - Displays success feedback in the web interface

### Technical Flow

1. **Frontend Detection**: `generateCode()` function checks if `body` has `agent-mode` class
2. **API Call**: If in agent mode, calls `handleAgentMode()` which sends POST request to `/api/agent`
3. **Backend Processing**: Server endpoint:
   - Validates the request
   - Opens VSCode with `-n` (new window) flag
   - Spawns the agent process with the user prompt as environment variable
   - Returns success response
4. **Agent Execution**: The AI agent:
   - Reads the user prompt from `USER_PROMPT` environment variable
   - Uses structured thinking to break down the task
   - Executes PowerShell commands to create files/folders
   - Can open created files in VSCode

## Key Features

### Agent Capabilities

- **File Creation**: Can create HTML, CSS, JavaScript, and other files
- **Directory Management**: Can create and organize project folders
- **Command Execution**: Can run PowerShell commands for various tasks
- **VSCode Integration**: Can open files and folders in VSCode
- **Structured Thinking**: Uses START → THINK → ACTION → OBSERVE → OUTPUT workflow

### UI/UX Features

- **Agent Mode Toggle**: Clear visual indicator when agent mode is active
- **Loading Animations**: Special loading animations for agent mode
- **Success Feedback**: Detailed success messages with status information
- **Error Handling**: Comprehensive error handling and user feedback

## Configuration

### Environment Variables

The agent requires a Gemini API key in the `.env` file:

```bash
GEMINI_API_KEY=your_api_key_here
```

### Dependencies

The agent project requires the following dependencies:

- `@google/generative-ai`: For Gemini AI integration
- `dotenv`: For environment variable management

## Usage Examples

### Simple Web Page

**Prompt**: "Create a simple HTML page with CSS styling"
**Result**: Agent creates HTML file with embedded CSS

### Complete Web Application

**Prompt**: "Build a todo app with HTML, CSS, and JavaScript"
**Result**: Agent creates organized file structure with full functionality

### Complex Projects

**Prompt**: "Create a REST API with Express.js and authentication"
**Result**: Agent creates complete project structure with multiple files

## Error Handling

The system includes comprehensive error handling:

- **Missing Agent Project**: Returns 404 if agent directory not found
- **Invalid Prompts**: Validates prompt input before processing
- **Process Errors**: Handles VSCode and agent process failures gracefully
- **API Errors**: Returns structured error responses

## File Structure

```
AI-coder-main/
├── server/
│   └── index.js          # Contains /api/agent endpoint
├── script.js             # Modified generateCode() and handleAgentMode()
├── styles.css            # Agent mode styling
└── ...

my-cursor - agent mode/
├── index.js              # Main agent logic
├── package.json          # Dependencies
├── .env                  # API keys
└── ...
```

## Future Enhancements

- **Real-time Progress**: Stream agent progress back to web interface
- **Result Preview**: Show created files in the web interface
- **Agent History**: Track and display previous agent tasks
- **Custom Tools**: Add more specialized tools for the agent
- **Multi-Agent Support**: Support for multiple concurrent agent tasks

## Troubleshooting

### Common Issues

1. **VSCode doesn't open**: Ensure VSCode is installed and available in PATH
2. **Agent doesn't start**: Check Gemini API key configuration
3. **Permission errors**: Ensure proper file system permissions
4. **Port conflicts**: Check if port 3000 is available

### Debug Mode

To enable debug logging, check the browser console and server logs for detailed information about the agent mode execution process.
