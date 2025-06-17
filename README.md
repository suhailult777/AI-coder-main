# AI-Powered Multi-Agent Code Editor with Authentication & Testing

A modern, browser-based code editor enhanced with AI capabilities, full authentication system, autonomous code generation agent, and intelligent test agent. Features Google's Gemini 2.0 Flash for code generation and Mistral Codestral for code analysis and testing, with secure user authentication and advanced multi-agent capabilities using vanilla HTML, CSS, and JavaScript.

![AI Code Editor Screenshot](https://via.placeholder.com/800x500.png?text=AI+Multi-Agent+Code+Editor+Screenshot)

## 🌟 Features

### Core Features

- **AI-Powered Code Generation**: Generate code using advanced AI models including Google Gemini 2.0 Flash
- **Multi-Agent System**: Autonomous code generation agent + intelligent test agent working together
- **Agent Mode**: Autonomous AI agent that can execute complex coding tasks with VSCode integration
- **Test Agent**: Intelligent code analysis and testing using Mistral Codestral
- **Multi-Language Support**: Supports syntax highlighting for various programming languages
- **Dark/Light Mode**: Toggle between themes based on your preference or system settings
- **Real-time Streaming**: Server-Sent Events (SSE) for real-time AI responses from both agents
- **Terminal Integration**: Execute commands and interact with system processes

### Authentication Features

- **User Registration & Login**: Secure account creation and login with email/password
- **Google Authentication**: Sign in with Google using Firebase Authentication
- **Session Management**: Secure session-based authentication with automatic logout
- **Password Security**: Bcrypt password hashing with salt for maximum security
- **Form Validation**: Client-side and server-side validation with user-friendly error messages
- **Database Support**: PostgreSQL integration with fallback to JSON storage
- **Responsive Design**: Authentication UI works seamlessly on desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support

### Agent Mode Features

- **Autonomous Task Execution**: AI agent can break down complex requests and execute them
- **VSCode Integration**: Automatically opens VSCode with new projects
- **File & Directory Management**: Create, organize, and manage project structures
- **Command Execution**: Run PowerShell/terminal commands for various tasks
- **Structured Thinking**: Uses START → THINK → ACTION → OBSERVE → OUTPUT workflow
- **Process Management**: Spawn and manage background processes
- **Real-time Status Updates**: Monitor agent progress through SSE streams
- **Code Content Streaming**: See actual code being written in real-time
- **File/Folder Creation Tracking**: Visual feedback for all file and directory operations

### Test Agent Features

- **Intelligent Code Analysis**: Uses Mistral Codestral for advanced code analysis and quality assessment
- **Automated Testing**: Generates comprehensive test strategies and identifies test cases
- **Multi-Language Support**: Analyzes various file types (.html, .css, .js, .json, .md, .py, .java, .cpp, .c, .ts, .jsx, .tsx)
- **Security Analysis**: Identifies potential security vulnerabilities and security best practices
- **Performance Analysis**: Evaluates code performance and suggests optimization opportunities
- **Code Quality Review**: Checks adherence to coding standards, maintainability, and best practices
- **Real-time Test Streaming**: Live updates during test execution with Server-Sent Events (SSE)
- **Detailed Reports**: Comprehensive markdown reports saved as `TEST_ANALYSIS_REPORT.md` within project folders
- **Project Structure Analysis**: Analyzes complete project structure and file organization
- **Unit Test Suggestions**: Provides specific unit test recommendations for code components
- **Automated Report Generation**: Creates executive summaries and actionable improvement recommendations

## 🤖 Multi-Agent System

### Overview

The Multi-Agent System consists of two intelligent AI agents working together to provide a complete development experience:

1. **Code Agent** (Gemini 2.0 Flash): Handles code generation, project creation, and development tasks
2. **Test Agent** (Mistral Codestral): Analyzes generated code, creates tests, and provides quality assurance

### Code Agent (Primary Agent)

The Code Agent is responsible for understanding user requirements and generating complete applications:

**Capabilities:**

- Complex project creation and file management
- Real-time code streaming with syntax highlighting
- Directory structure planning and creation
- Integration with development tools (VSCode)
- PowerShell/terminal command execution
- Progressive development with live feedback

**Enhanced Streaming Features:**

- **Live Code Display**: See the actual code being written in real-time
- **File Creation Tracking**: Visual indicators for files and folders being created
- **Tool Call Monitoring**: Real-time feedback on what tools are being executed
- **Content Preview**: Expandable code previews with syntax highlighting
- **Progress Indicators**: Detailed status updates throughout the development process

### Test Agent (Analysis Agent)

The Test Agent automatically analyzes generated code and provides comprehensive testing using **Mistral Codestral**, specifically designed for code analysis and understanding.

**Analysis Capabilities:**

- **Functional Testing**: Verifies that code works as intended and suggests test cases
- **Security Analysis**: Identifies potential vulnerabilities and security best practices
- **Performance Evaluation**: Checks for optimization opportunities and performance bottlenecks
- **Code Quality Review**: Ensures adherence to best practices, maintainability, and documentation standards
- **Cross-Platform Compatibility**: Analyzes compatibility across different environments and browsers
- **Accessibility Compliance**: Checks for accessibility standards and inclusive design practices
- **Architecture Analysis**: Reviews project structure, file organization, and design patterns

**Supported File Types:**

- Web Technologies: `.html`, `.css`, `.js`, `.jsx`, `.tsx`
- Programming Languages: `.py`, `.java`, `.cpp`, `.c`, `.ts`
- Configuration Files: `.json`, `.md`

**Test Agent Workflow:**

1. **Project Detection**: Automatically detects newly created projects or analyzes specified project paths
2. **File Scanning**: Recursively scans project directories (excluding node_modules, .git, dist, build)
3. **Individual File Analysis**: Analyzes each file using Mistral Codestral with structured prompts
4. **Comprehensive Reporting**: Generates detailed analysis reports with actionable recommendations
5. **Progress Streaming**: Real-time updates via Server-Sent Events showing analysis progress
6. **Report Generation**: Creates markdown reports saved as `TEST_ANALYSIS_REPORT.md` in the project folder

**Analysis Report Structure:**

- **Executive Summary**: Overall project quality assessment
- **Key Findings**: Most important issues and recommendations prioritized by impact
- **Test Plan**: Comprehensive testing strategy with specific test cases
- **Priority Issues**: Critical issues that should be addressed first
- **Security Recommendations**: Security vulnerabilities and mitigation strategies
- **Performance Optimization**: Performance improvement suggestions
- **Code Quality Metrics**: Maintainability, documentation, and best practices compliance
- **Detailed File Analysis**: Individual file breakdowns with specific recommendations

6. **Real-time Updates**: Streams progress and findings to the frontend

### How the Multi-Agent System Works

1. **User Request**: User submits a coding request through the web interface
2. **Code Agent Activation**:
   - Analyzes the request and breaks it down into actionable steps
   - Creates project structure and files
   - Streams real-time progress including code content
   - Opens the project in VSCode
3. **Test Agent Activation**:
   - Triggered when user clicks the "Test Application" button (appears after code generation)
   - Analyzes the generated code using Mistral Codestral
   - Performs comprehensive code analysis with real-time streaming
   - Generates detailed analysis report saved as `TEST_ANALYSIS_REPORT.md` in project directory
   - Provides actionable recommendations and improvement suggestions
4. **Results**: User receives both the generated code and comprehensive test analysis

### User Flow

1. **Standard Development Flow**:

   - Toggle to **Agent Mode** in the web interface
   - Enter a complex coding request (e.g., "Build a complete REST API with authentication")
   - Click "Enter" to submit the request
   - Watch real-time code generation with live streaming
   - System automatically opens VSCode with the created project
   - Click "Test Application" when it appears to run comprehensive analysis

2. **Multi-Agent Workflow**:
   - **Code Agent**: Generates the requested application with real-time code streaming
   - **Test Agent**: Analyzes the generated code using Mistral Codestral for quality assurance
   - **Integration**: Both agents work together to deliver a complete, tested solution with comprehensive reports

### Technical Flow

1. **Frontend Detection**: Interface detects agent mode and calls `/api/agent` endpoint
2. **Code Agent Execution**:
   - Backend spawns the code agent process
   - Agent creates project files with detailed streaming
   - Real-time updates show code content, file creation, and tool usage
   - VSCode integration for immediate development access
3. **Test Agent Activation**:
   - User clicks "Test Application" button (appears after code generation completes)
   - Backend spawns test agent process with Mistral Codestral
   - Comprehensive code analysis with real-time streaming via SSE
   - Detailed markdown reports saved as `TEST_ANALYSIS_REPORT.md` in project directory
   - Analysis includes security, performance, quality, and testing recommendations
4. **Results Delivery**: Complete application with analysis reports and recommendations

### Agent Capabilities

#### Code Agent Capabilities

- **Project Creation**: Create complete project structures with proper organization
- **File Management**: Create HTML, CSS, JavaScript, and other files with full content
- **Directory Organization**: Organize files into logical folder structures
- **Command Execution**: Run PowerShell/terminal commands for setup and configuration
- **VSCode Integration**: Automatic project opening in VSCode
- **Real-time Streaming**: Live code content display with syntax highlighting
- **Tool Monitoring**: Real-time feedback on tool execution and results
- **Structured Thinking**: START → THINK → ACTION → OBSERVE → OUTPUT workflow

#### Test Agent Capabilities

- **Multi-Language Analysis**: Supports web apps (HTML/CSS/JS), Node.js, Python, TypeScript, and more
- **Functional Testing**: Verifies core functionality and suggests comprehensive test cases
- **Security Analysis**: Identifies vulnerabilities, security best practices, and potential attack vectors
- **Performance Testing**: Evaluates load times, responsiveness, memory usage, and optimization opportunities
- **Code Quality Review**: Checks coding standards, documentation quality, maintainability, and technical debt
- **Architecture Analysis**: Reviews project structure, design patterns, and code organization
- **Accessibility Testing**: Ensures compliance with WCAG guidelines and inclusive design principles
- **Cross-Platform Analysis**: Tests compatibility across different environments and platforms
- **Automated Report Generation**: Creates comprehensive markdown reports with executive summaries
- **Real-time Progress Streaming**: Live feedback during analysis with detailed status updates
- **Unit Test Recommendations**: Suggests specific unit tests and testing strategies for each component
- **Best Practices Compliance**: Evaluates adherence to industry standards and framework conventions
- **Dependency Analysis**: Reviews third-party libraries and potential security/maintenance concerns

## 🚀 Getting Started

### Prerequisites

- **Node.js** (version 16 or higher)
- **pnpm** (recommended) or **npm** (package managers)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (required for AI model access)
- **VSCode** (required for Agent Mode with automatic project opening)
- **PowerShell** (Windows) or **Terminal** (macOS/Linux) for command execution

**Required API Keys:**

- **Gemini API key** (required for Code Agent) - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Mistral API key** (required for Test Agent) - Get from [Mistral AI Console](https://console.mistral.ai/)
- **OpenRouter API key** (optional, for standard chat mode) - Get from [OpenRouter](https://openrouter.ai/)

**Test Agent Requirements:**

- **Mistral Codestral**: Specialized AI model for code analysis and understanding
- **Project Directory Access**: Test Agent needs read access to generated project folders
- **File System Permissions**: Write access to create analysis reports in project directories

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/ai-code-editor.git
   cd ai-code-editor
   ```

2. Install dependencies using pnpm (recommended):

   ```bash
   pnpm install
   ```

   Or using npm:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file and update the following values:

   ```env
   PORT=3000
   NODE_ENV=development
   SESSION_SECRET=your-super-secret-session-key-change-this-in-production

   # Database Configuration (Optional - defaults to JSON storage)
   USE_DATABASE=false
   # DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require

   # Code Agent Configuration (Required for Code Agent)
   GEMINI_API_KEY=your_gemini_api_key_here

   # Test Agent Configuration (Required for Test Agent)
   MISTRAL_API_KEY=your_mistral_api_key_here

   # OpenRouter API Configuration (for standard chat mode)
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

4. Start the development server:

   ```bash
   # Using pnpm (recommended)
   pnpm run dev

   # Using npm
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## 🗄️ Database Setup

### Overview

The application supports both JSON file storage (default) and PostgreSQL database storage. PostgreSQL is recommended for production environments and provides better performance, security, and scalability.

### Quick PostgreSQL Setup with Neon

1. **Create Neon Account**:

   - Go to [console.neon.tech](https://console.neon.tech)
   - Sign up for a free account
   - Create a new project

2. **Get Connection String**:

   - In your Neon dashboard, go to **Connection Details**
   - Copy the connection string:

   ```
   postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

3. **Update Environment**:

   ```env
   USE_DATABASE=true
   DATABASE_URL=postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

4. **Test Connection**:
   ```bash
   npm run dev
   ```
   You should see: `✅ Connected to Neon PostgreSQL database`

### Database Schema

The system automatically creates these tables:

#### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  name VARCHAR(255),
  provider VARCHAR(50) DEFAULT 'local',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Session Table (Auto-created)

```sql
CREATE TABLE session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
```

### Migration from JSON

If you have existing users in JSON format:

```bash
# See what would be migrated (recommended first)
npm run migrate:dry-run

# Migrate with automatic backup
npm run migrate:backup

# Direct migration
npm run migrate
```

### Health Monitoring

Check database status:

```bash
curl http://localhost:3000/api/health
```

Response includes database connection status, version, and pool statistics.

### Configuration

#### OpenRouter API Key

1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Get your API key
3. Replace the `API_KEY` in `script.js` with your actual API key

#### Firebase Google Authentication (Optional)

For Google authentication to work in production:

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Google Authentication in the Authentication section
3. Get your Firebase configuration
4. Update `firebase-config.js` with your actual Firebase configuration
5. Set up Firebase Admin SDK credentials in your `.env` file

## 🛠️ Usage

### Authentication

1. **Sign Up**: Click "Sign In" and switch to the "Register" tab to create a new account
2. **Login**: Use your email and password to log in
3. **Google Sign-In**: Click "Continue with Google" for quick authentication
4. **Logout**: Click the "Logout" button when you're done

### Standard Code Generation

1. **Login** to your account (required for full functionality)
2. Enter your coding prompt in the input area
3. (Optional) Select a different AI model from the dropdown
4. Click "Generate" or press Ctrl+Enter
5. View the generated code in the output area
6. Use the copy button to copy the code to your clipboard

### Agent Mode Usage

1. **Enable Agent Mode**: Toggle the "Agent Mode" switch in the interface
2. **Enter Complex Request**: Describe a complex coding task (e.g., "Build a complete todo app with local storage")
3. **Submit Request**: Click "Enter" to submit your request
4. **Watch Real-time Development**:
   - See actual code being written in real-time
   - Monitor file and folder creation
   - Track tool execution and commands
5. **VSCode Integration**: The system will automatically:
   - Open a new VSCode window with the created project
   - Organize files in proper directory structure
6. **Test Your Application**:
   - Click the "Test Application" button when it appears (after code generation)
   - Watch comprehensive code analysis in real-time with detailed progress updates
   - Review the generated `TEST_ANALYSIS_REPORT.md` file in your project directory
   - Follow the actionable recommendations for code improvements and testing strategies

### Multi-Agent Workflow

1. **Code Generation Phase**:

   - Code Agent (Gemini) analyzes your request and breaks it into actionable steps
   - Creates complete project structure with proper file organization
   - Streams progress with live code preview and syntax highlighting
   - Shows real-time file creation, directory structure, and tool execution
   - Automatically opens the project in VSCode for immediate development access

2. **Testing Phase**:

   - Test Agent (Mistral Codestral) automatically analyzes the generated code
   - Performs comprehensive testing including security, performance, and quality analysis
   - Streams testing progress with detailed status updates and findings
   - Generates a comprehensive `TEST_ANALYSIS_REPORT.md` within the project folder
   - Provides actionable recommendations and improvement suggestions

3. **Results**:
   - Complete, analyzed application ready for development and deployment
   - Comprehensive analysis report with executive summary and detailed findings
   - VSCode integration for immediate development and code modification
   - Test recommendations and security best practices implementation guide

## 🧪 Test Agent Details

### Overview

The Test Agent is a specialized AI-powered code analysis system that uses **Mistral Codestral** to provide comprehensive code quality assessment, security analysis, and testing recommendations.

### Key Features

**Intelligent Code Analysis:**

- Analyzes code structure, logic, and implementation patterns
- Identifies potential bugs, edge cases, and error conditions
- Evaluates code maintainability and readability
- Checks for adherence to coding standards and best practices

**Security Assessment:**

- Identifies security vulnerabilities and potential attack vectors
- Reviews input validation and sanitization practices
- Checks for secure coding practices and common security pitfalls
- Provides specific security recommendations and mitigation strategies

**Performance Analysis:**

- Evaluates code efficiency and performance characteristics
- Identifies performance bottlenecks and optimization opportunities
- Reviews resource usage and memory management
- Suggests performance improvements and best practices

**Testing Strategy:**

- Generates comprehensive test plans and test case recommendations
- Suggests unit tests, integration tests, and end-to-end testing approaches
- Identifies critical paths and edge cases that require testing
- Provides specific testing frameworks and methodologies recommendations

### Test Agent API Endpoints

**Start Test Agent Analysis:**

```
POST /api/test-agent/run
Content-Type: application/json

{
  "code": "Code content to analyze (optional - will analyze latest project if not provided)"
}
```

**Get Real-time Status Updates:**

```
GET /api/test-agent/status/stream
Accept: text/event-stream
```

**Get Analysis Report:**

```
GET /api/test-agent/report
```

### Test Agent Configuration

The Test Agent can be configured via environment variables:

```env
# Test Agent Configuration
MISTRAL_API_KEY=your_mistral_api_key_here
TARGET_PROJECT_PATH=/path/to/specific/project  # Optional: specify exact project to analyze
```

### Analysis Report Structure

The Test Agent generates comprehensive reports in markdown format with the following sections:

1. **Executive Summary**

   - Overall project quality score
   - Key findings and recommendations summary
   - Critical issues requiring immediate attention

2. **Security Analysis**

   - Security vulnerabilities identified
   - Risk assessment and impact analysis
   - Specific remediation steps and best practices

3. **Performance Assessment**

   - Performance bottlenecks and optimization opportunities
   - Resource usage analysis
   - Scalability considerations and recommendations

4. **Code Quality Review**

   - Maintainability and readability assessment
   - Documentation quality and completeness
   - Adherence to coding standards and conventions

5. **Testing Strategy**

   - Comprehensive test plan with specific test cases
   - Testing framework recommendations
   - Edge cases and error condition testing

6. **Detailed File Analysis**
   - Individual file breakdowns with specific recommendations
   - Line-by-line code review for critical sections
   - Refactoring suggestions and improvements

### Usage Examples

**Basic Test Agent Usage:**

1. Create a project using the Code Agent in Agent Mode
2. Click the "Test Application" button when it appears
3. Watch real-time analysis progress in the streaming output
4. Review the generated `TEST_ANALYSIS_REPORT.md` in your project folder

**Advanced Test Agent Usage:**

```bash
# Run Test Agent on specific project
TARGET_PROJECT_PATH="/path/to/your/project" node backend/agents/test_agent.js

# Run Test Agent with custom environment
MISTRAL_API_KEY="your_key" TARGET_PROJECT_PATH="/path/to/project" node backend/agents/test_agent.js
```

### Test Agent Streaming Output

The Test Agent provides real-time streaming updates during analysis:

- **Project Detection**: Shows which project is being analyzed
- **File Scanning**: Lists all files found for analysis
- **Individual File Analysis**: Progress updates for each file being analyzed
- **Analysis Completion**: Summary of findings and report generation
- **Error Handling**: Detailed error messages and troubleshooting information

### Example Prompts

#### Standard Mode

- "Create a Python function to reverse a string"
- "Write a React component for a todo list"
- "Generate a SQL query to find duplicate records"

#### Agent Mode

- "Build a complete todo application with HTML, CSS, and JavaScript"
- "Create a REST API with Express.js, authentication, and database integration"
- "Set up a React project with routing and state management"
- "Build a responsive e-commerce landing page with shopping cart functionality"

## 🧪 Testing

### Running Tests

The project includes comprehensive tests for all major functionality including the multi-agent system:

```bash
# Run all tests (includes multi-agent testing)
npm test

# Run specific test files
node test/test-agent.js          # Multi-agent integration test
node test/test-integration.js    # General integration tests
node test/test-sse-flow.js       # Server-Sent Events testing
```

### Test Coverage

**Multi-Agent System Tests:**

- **Code Agent Tests**: Project creation, VSCode integration, command execution
- **Test Agent Tests**: Code analysis, report generation, streaming functionality
- **Integration Tests**: End-to-end multi-agent workflow testing

**Core Functionality Tests:**

- **Authentication Tests**: User registration, login, session management
- **SSE Tests**: Real-time streaming functionality for both agents
- **Database Tests**: PostgreSQL and JSON storage functionality
- **API Tests**: All endpoints including agent-specific APIs

### Multi-Agent Testing Workflow

The `test/test-agent.js` file demonstrates the complete multi-agent workflow:

1. **Authentication Setup**: Creates test user and establishes session
2. **Code Agent Test**: Triggers code generation with Gemini
3. **Project Creation Verification**: Confirms project structure is created
4. **Test Agent Activation**: Triggers Mistral Codestral analysis
5. **Report Verification**: Confirms analysis report generation
6. **Integration Validation**: Verifies complete workflow success

### Debug Tools

The project includes several debug tools in the `test/` directory:

- `debug.html`: Multi-agent debugging interface with real-time monitoring
- `test-sse.html`: Server-Sent Events testing for both Code and Test Agents
- `test-stream.html`: Streaming functionality testing interface

### Testing the Test Agent Independently

You can test the Test Agent independently using:

```bash
# Test with latest project
node backend/agents/test_agent.js

# Test with specific project path
TARGET_PROJECT_PATH="/path/to/project" node backend/agents/test_agent.js

# Test with custom Mistral API key
MISTRAL_API_KEY="your_key" node backend/agents/test_agent.js
```

### Test Agent Status Monitoring

Monitor Test Agent status in real-time:

```bash
# Check current status
cat backend/agents/test-agent-status.json

# Monitor live updates via API
curl -N http://localhost:3000/api/test-agent/status/stream
```

## 🌐 Technologies Used

### Frontend

- **HTML5, CSS3, JavaScript (ES6+)**: Pure vanilla implementation, no frameworks
- **Code Highlighting**: highlight.js for syntax highlighting
- **Icons**: Font Awesome for UI icons
- **Fonts**: Google Fonts (Fira Code, Segoe UI)
- **Real-time Communication**: Server-Sent Events (SSE) for live updates

### Backend

- **Node.js**: Server runtime environment
- **Express.js**: Web application framework
- **Session Management**: Express-session with PostgreSQL/JSON storage
- **Password Security**: bcryptjs for password hashing
- **Database**: PostgreSQL with pg library, JSON fallback
- **Process Management**: Child process spawning for agent mode

### Authentication

- **Firebase Authentication**: Google sign-in integration
- **Session-based Auth**: Secure server-side session management
- **CORS**: Cross-origin resource sharing configuration
- **Database Sessions**: PostgreSQL session storage with connect-pg-simple

### AI Integration

- **OpenRouter API**: Access to multiple AI models for general code generation
- **Google Gemini 2.0 Flash**: Primary AI model for Code Agent (project creation and development)
- **Mistral Codestral**: Specialized AI model for Test Agent (code analysis and testing)
- **Autonomous Agents**: Multi-agent AI-powered task execution and automation
- **Real-time AI Streaming**: Server-Sent Events integration for live AI responses

### Multi-Agent Architecture

- **Code Agent**: Gemini-powered autonomous development agent
- **Test Agent**: Mistral Codestral-powered code analysis and testing agent
- **Agent Coordination**: Seamless workflow between code generation and analysis
- **Process Management**: Background agent processes with status monitoring
- **Report Generation**: Automated analysis report creation in markdown format

### Agent Mode

- **VSCode Integration**: Automatic IDE launching and project management
- **Command Execution**: PowerShell/terminal command execution
- **File System Operations**: Automated file and directory management
- **Process Spawning**: Background process management for agent tasks

## 🔧 Troubleshooting

### Common Issues

#### Agent Mode Issues

**VSCode doesn't open**

- Ensure VSCode is installed and available in PATH
- Check if VSCode command `code` works in terminal
- Verify agent directory exists

**Agent doesn't start**

- Check Gemini API key in `.env` file
- Verify agent dependencies are installed
- Check server logs for error messages

#### Test Agent Issues

**Test Agent doesn't start**

- Check Mistral API key in `.env` file: `MISTRAL_API_KEY=your_key_here`
- Verify Mistral API key is valid at [Mistral Console](https://console.mistral.ai/)
- Ensure Test Agent dependencies are installed: `npm install @mistralai/mistralai`
- Check server logs for Test Agent process spawn errors

**No project found to analyze**

- Ensure Code Agent has created a project first using Agent Mode
- Check that project exists in `backend/agent/` directory
- Verify project folder contains analyzable files (.html, .css, .js, etc.)
- Use `TARGET_PROJECT_PATH` environment variable to specify exact project path

**Analysis fails or produces incomplete results**

- Verify internet connection for Mistral API access
- Check API rate limits - Test Agent includes delays to prevent rate limiting
- Ensure project files are readable and contain valid code
- Check Test Agent status file: `backend/agents/test-agent-status.json`

**Report not generated**

- Verify write permissions in project directory
- Check available disk space for report generation
- Ensure project path exists and is accessible
- Look for specific error messages in Test Agent output

**Streaming updates not working**

- Check Server-Sent Events (SSE) connection in browser network tab
- Verify `/api/test-agent/status/stream` endpoint is accessible
- Clear browser cache and reload the page
- Check for firewall or proxy blocking SSE connections

#### Database Issues

**Connection refused**

- Verify DATABASE_URL is correct
- Check network connectivity to database
- Ensure database server is running

**SSL certificate error**

- Add `?sslmode=require` to connection string
- Check SSL configuration in database settings

**Migration fails**

- Backup existing data before migration
- Check database permissions
- Verify JSON file format

#### Authentication Issues

**Google sign-in not working**

- Update Firebase configuration
- Check Firebase project settings
- Verify domain is authorized in Firebase console

**Session expires immediately**

- Check SESSION_SECRET in environment
- Verify session storage configuration
- Check for clock synchronization issues

## 📁 Project Structure

```
AI-coder-main/
├── backend/                 # Backend services
│   ├── server/             # Express.js server
│   ├── api/                # API endpoints
│   ├── scripts/            # Database migration scripts
│   └── agent/              # Agent mode functionality
├── frontend/               # Frontend application
│   ├── public/             # Static assets
│   └── ...                 # HTML, CSS, JS files
├── config/                 # Configuration files
│   └── firebase-config.js  # Firebase configuration
├── test/                   # Test files and debug tools
│   ├── test-*.js          # Test scripts
│   └── *.html             # Debug interfaces
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
└── README.md              # This file
```

## 📱 Browser Support

The editor works on all modern browsers including:

- Google Chrome (latest)
- Mozilla Firefox (latest)
- Safari (latest)
- Microsoft Edge (latest)

## 🚀 Performance & Scalability

### Database Performance

- PostgreSQL connection pooling for optimal performance
- Automatic session cleanup and management
- Efficient user lookup with indexed queries

### Agent Mode Optimization

- Process spawning with proper resource management
- VSCode integration with minimal system impact
- Structured agent workflow for efficient task execution

### Real-time Features

- Server-Sent Events for low-latency updates
- Efficient streaming for large responses
- Automatic reconnection handling

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) for providing access to various AI models
- [Google Gemini](https://ai.google/discover/gemini/) for the powerful AI capabilities in the Code Agent
- [Mistral AI](https://mistral.ai/) for Codestral, the specialized code analysis model powering the Test Agent
- [highlight.js](https://highlightjs.org/) for syntax highlighting
- [Font Awesome](https://fontawesome.com/) for the icons
- The open-source community for the various tools and libraries used in this project

## 📧 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter) - your.email@example.com

Project Link: [https://github.com/yourusername/ai-code-editor](https://github.com/yourusername/ai-code-editor)

---

Made with ❤️ by Your Name
