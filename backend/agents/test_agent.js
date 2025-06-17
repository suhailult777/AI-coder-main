// Test Agent - Uses Mistral Codestral to analyze and test code created by main agent
import { config } from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '..', '..', '.env') });

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

if (!MISTRAL_API_KEY) {
    console.error('❌ MISTRAL_API_KEY not found in environment variables');
    process.exit(1);
}

class TestAgent {
    constructor() {
        this.model = "codestral-latest"; // Mistral Codestral for code analysis
        this.statusFile = path.join(__dirname, 'test-agent-status.json');
    }

    async updateStatus(status, message, details = {}) {
        const statusData = {
            status,
            message,
            timestamp: new Date().toISOString(),
            model: this.model,
            ...details
        };

        try {
            fs.writeFileSync(this.statusFile, JSON.stringify(statusData, null, 2));
            console.log(`📊 Test Agent Status: ${status} - ${message}`);
        } catch (error) {
            console.error('❌ Failed to update status:', error);
        }
    } async analyzeWithMistral(prompt) {
        try {
            const response = await fetch(MISTRAL_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${MISTRAL_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: "system",
                            content: `You are a skilled code analyzer and tester. Your role is to:
1. Analyze code for potential issues, bugs, and improvements
2. Suggest test cases and testing strategies
3. Evaluate code quality, security, and performance
4. Provide constructive feedback and recommendations
5. Generate unit tests when appropriate

Be thorough, practical, and constructive in your analysis.`
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.3, // Lower temperature for more focused analysis
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('❌ Mistral API Error:', error);
            throw error;
        }
    } async analyzeProject(projectPath) {
        console.log('🔍 Starting project analysis with Mistral Codestral...');

        await this.updateStatus('analyzing', 'Scanning project files...', {
            step: 'scanning',
            projectPath: projectPath
        });

        if (!fs.existsSync(projectPath)) {
            throw new Error(`Project path does not exist: ${projectPath}`);
        }

        // Get all files in the project
        const files = this.getProjectFiles(projectPath);
        console.log(`📁 Found ${files.length} files to analyze`);

        await this.updateStatus('analyzing', `Found ${files.length} files to analyze`, {
            step: 'found-files',
            fileCount: files.length,
            files: files.map(f => ({ name: path.basename(f.path), extension: f.extension }))
        });

        let analysisResults = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const content = fs.readFileSync(file.path, 'utf8');
                const relativePath = path.relative(projectPath, file.path);

                console.log(`🔍 Analyzing: ${relativePath}`);

                await this.updateStatus('analyzing', `Analyzing ${relativePath}... (${i + 1}/${files.length})`, {
                    step: 'analyzing-file',
                    currentFile: relativePath,
                    progress: Math.round(((i + 1) / files.length) * 100),
                    fileContent: content.substring(0, 200) + '...' // Show preview
                });

                const analysisPrompt = `
Please analyze this ${file.extension} file for:

**File:** ${relativePath}

**Code:**
\`\`\`${file.extension}
${content}
\`\`\`

**Analysis Tasks:**
1. **Code Quality**: Check for best practices, code structure, and maintainability
2. **Potential Issues**: Identify bugs, security vulnerabilities, or performance issues
3. **Testing Strategy**: Suggest what should be tested and how
4. **Improvements**: Recommend specific improvements or optimizations
5. **Unit Tests**: If applicable, suggest unit test cases

Please provide a structured analysis with clear sections.
                `;

                const analysis = await this.analyzeWithMistral(analysisPrompt);

                analysisResults.push({
                    file: relativePath,
                    extension: file.extension,
                    analysis: analysis,
                    linesOfCode: content.split('\n').length
                });

                await this.updateStatus('analyzing', `Completed analysis of ${relativePath}`, {
                    step: 'file-complete',
                    currentFile: relativePath,
                    analysisPreview: analysis.substring(0, 150) + '...'
                });

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`❌ Error analyzing ${file.path}:`, error);
                analysisResults.push({
                    file: file.path,
                    error: error.message
                });

                await this.updateStatus('analyzing', `Error analyzing ${path.relative(projectPath, file.path)}: ${error.message}`, {
                    step: 'file-error',
                    currentFile: path.relative(projectPath, file.path),
                    error: error.message
                });
            }
        }

        return analysisResults;
    }

    getProjectFiles(projectPath) {
        const files = [];
        const extensions = ['.html', '.css', '.js', '.json', '.md', '.py', '.java', '.cpp', '.c', '.ts', '.jsx', '.tsx'];

        function scanDirectory(dir) {
            const items = fs.readdirSync(dir);

            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    // Skip node_modules and other common directories
                    if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
                        scanDirectory(fullPath);
                    }
                } else if (stat.isFile()) {
                    const ext = path.extname(fullPath).toLowerCase();
                    if (extensions.includes(ext)) {
                        files.push({
                            path: fullPath,
                            extension: ext.substring(1), // Remove the dot
                            size: stat.size
                        });
                    }
                }
            }
        }

        scanDirectory(projectPath);
        return files;
    }

    async generateReport(analysisResults, projectPath) {
        await this.updateStatus('generating-report', 'Generating comprehensive test report...');

        const reportPrompt = `
Based on the following code analysis results, please generate a comprehensive test report:

**Project Path:** ${projectPath}
**Analysis Results:**

${analysisResults.map(result => `
**File: ${result.file}**
${result.error ? `Error: ${result.error}` : result.analysis}
---
`).join('\n')}

Please provide:
1. **Executive Summary**: Overall project quality assessment
2. **Key Findings**: Most important issues and recommendations
3. **Test Plan**: Comprehensive testing strategy
4. **Priority Issues**: What should be fixed first
5. **Recommendations**: Specific actionable improvements

Format the report in a clear, professional manner.
        `;

        try {
            const report = await this.analyzeWithMistral(reportPrompt);
            // Save the report inside the project folder
            const reportPath = path.join(projectPath, 'TEST_ANALYSIS_REPORT.md');
            const fullReport = `# Test Analysis Report
Generated by Mistral Codestral Test Agent
Date: ${new Date().toISOString()}
Project: ${projectPath}

---

${report}

---

## Detailed Analysis Results

${analysisResults.map(result => `
### ${result.file}
${result.error ? `**Error:** ${result.error}` : `
**Lines of Code:** ${result.linesOfCode}
**Analysis:**
${result.analysis}
`}
---
`).join('\n')}
            `;

            fs.writeFileSync(reportPath, fullReport);
            console.log(`📄 Test report saved to: ${reportPath}`);

            return { report, reportPath };
        } catch (error) {
            console.error('❌ Error generating report:', error);
            throw error;
        }
    } async run() {
        try {
            console.log('🧪 Test Agent (Mistral Codestral) Starting...');

            await this.updateStatus('starting', 'Test Agent initializing...');

            // Check if a specific project path was provided
            const targetProjectPath = process.env.TARGET_PROJECT_PATH;
            let projectToAnalyze = null;

            if (targetProjectPath && fs.existsSync(targetProjectPath)) {
                // Use the specified project path
                const projectName = path.basename(targetProjectPath);
                projectToAnalyze = {
                    name: projectName,
                    path: targetProjectPath,
                    created: fs.statSync(targetProjectPath).birthtime
                };
                console.log(`🎯 Using specified project: ${projectName}`);
            } else {
                // Look for the latest project created by the main agent
                const agentPath = path.join(__dirname, '..', 'agent');
                const projects = fs.readdirSync(agentPath)
                    .filter(item => {
                        const fullPath = path.join(agentPath, item);
                        return fs.statSync(fullPath).isDirectory() &&
                            item !== 'node_modules' &&
                            !item.endsWith('.json');
                    })
                    .map(item => ({
                        name: item,
                        path: path.join(agentPath, item),
                        created: fs.statSync(path.join(agentPath, item)).birthtime
                    }))
                    .sort((a, b) => b.created - a.created);

                if (projects.length === 0) {
                    throw new Error('No projects found to analyze. Make sure the main agent has created a project first.');
                }

                projectToAnalyze = projects[0];
            }

            console.log(`🎯 Analyzing project: ${projectToAnalyze.name}`);

            await this.updateStatus('found-project', `Found project to analyze: ${projectToAnalyze.name}`, {
                projectName: projectToAnalyze.name,
                projectPath: projectToAnalyze.path
            });

            // Analyze the project
            const analysisResults = await this.analyzeProject(projectToAnalyze.path);

            // Generate comprehensive report
            const { report, reportPath } = await this.generateReport(analysisResults, projectToAnalyze.path);

            await this.updateStatus('completed', 'Analysis completed successfully!', {
                projectAnalyzed: projectToAnalyze.name,
                filesAnalyzed: analysisResults.length,
                reportPath: reportPath,
                summary: report.substring(0, 200) + '...'
            });

            console.log('🎉 Test Agent completed successfully!');
            console.log(`📊 Analyzed ${analysisResults.length} files`);
            console.log(`📄 Report: ${reportPath}`);

        } catch (error) {
            console.error('❌ Test Agent failed:', error);
            await this.updateStatus('error', error.message);
            process.exit(1);
        }
    }
}

// Run the test agent
const testAgent = new TestAgent();
testAgent.run();
