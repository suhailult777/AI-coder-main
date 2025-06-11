# AI-Coder Deployment Script for Netlify and Render (PowerShell)
# This script helps deploy the application to both platforms

Write-Host "🚀 AI-Coder Deployment Script" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

# Function to check if a command exists
function Test-Command($command) {
    try {
        Get-Command $command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check required tools
$tools = @("pnpm", "git")
foreach ($tool in $tools) {
    if (-not (Test-Command $tool)) {
        Write-Host "❌ $tool is not installed. Please install it first." -ForegroundColor Red
        exit 1
    }
}

# Check if Netlify CLI is installed
if (-not (Test-Command "netlify")) {
    Write-Host "⚠️  Netlify CLI not found. Installing..." -ForegroundColor Yellow
    pnpm install -g netlify-cli
}

# Check if Render CLI is installed
if (-not (Test-Command "render")) {
    Write-Host "⚠️  Render CLI not found. Please install it from: https://render.com/docs/cli" -ForegroundColor Yellow
    Write-Host "   You can skip Render CLI and deploy via web interface instead." -ForegroundColor Yellow
}

Write-Host "✅ Prerequisites check complete" -ForegroundColor Green
Write-Host ""

# Build frontend assets
Write-Host "🏗️  Building frontend assets..." -ForegroundColor Yellow
if (-not (Test-Path "public")) {
    Write-Host "❌ Public directory not found!" -ForegroundColor Red
    exit 1
}

# Copy configuration file to root for both deployments
if (Test-Path "public/config.js") {
    Copy-Item "public/config.js" "./" -Force
}

Write-Host "✅ Frontend assets ready" -ForegroundColor Green
Write-Host ""

# Deploy to Netlify (Frontend)
Write-Host "📤 Deploying frontend to Netlify..." -ForegroundColor Cyan
Write-Host "Please make sure you have:" -ForegroundColor Yellow
Write-Host "1. Created a Netlify account" -ForegroundColor White
Write-Host "2. Connected your repository to Netlify" -ForegroundColor White
Write-Host "3. Set up the following build settings:" -ForegroundColor White
Write-Host "   - Build command: echo 'Static site - no build needed'" -ForegroundColor White
Write-Host "   - Publish directory: public" -ForegroundColor White
Write-Host ""

$deployNetlify = Read-Host "Do you want to deploy to Netlify now? (y/n)"

if ($deployNetlify -eq "y" -or $deployNetlify -eq "Y") {
    Write-Host "🚀 Deploying to Netlify..." -ForegroundColor Green
    netlify deploy --prod --dir public
    Write-Host "✅ Netlify deployment complete!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping Netlify deployment" -ForegroundColor Yellow
    Write-Host "   You can deploy later using: netlify deploy --prod --dir public" -ForegroundColor White
    Write-Host ""
}

# Deploy to Render (Backend)
Write-Host "📤 Deploying backend to Render..." -ForegroundColor Cyan
Write-Host "Please make sure you have:" -ForegroundColor Yellow
Write-Host "1. Created a Render account" -ForegroundColor White
Write-Host "2. Created a PostgreSQL database on Render" -ForegroundColor White
Write-Host "3. Set up the following environment variables in Render:" -ForegroundColor White
Write-Host "   - NODE_ENV=production" -ForegroundColor White
Write-Host "   - GEMINI_API_KEY=your-gemini-key" -ForegroundColor White
Write-Host "   - OPENROUTER_API_KEY=your-openrouter-key" -ForegroundColor White
Write-Host "   - FIREBASE_PROJECT_ID=your-firebase-project-id" -ForegroundColor White
Write-Host "   - FIREBASE_CLIENT_EMAIL=your-firebase-email" -ForegroundColor White
Write-Host "   - FIREBASE_PRIVATE_KEY=your-firebase-private-key" -ForegroundColor White
Write-Host "   - FRONTEND_URL=https://your-netlify-app.netlify.app" -ForegroundColor White
Write-Host ""

$deployRender = Read-Host "Do you want to deploy to Render now? (y/n)"

if ($deployRender -eq "y" -or $deployRender -eq "Y") {
    if (Test-Command "render") {
        Write-Host "🚀 Deploying to Render..." -ForegroundColor Green
        render services deploy
        Write-Host "✅ Render deployment complete!" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Render CLI not available. Please deploy via web interface:" -ForegroundColor Blue
        Write-Host "   1. Go to https://dashboard.render.com/" -ForegroundColor White
        Write-Host "   2. Connect your repository" -ForegroundColor White
        Write-Host "   3. Use the render.yaml configuration" -ForegroundColor White
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping Render deployment" -ForegroundColor Yellow
    Write-Host "   You can deploy later via Render dashboard" -ForegroundColor White
    Write-Host ""
}

# Update frontend configuration
Write-Host "🔧 Updating frontend configuration..." -ForegroundColor Yellow
Write-Host "Make sure to update the API_BASE_URL in public/config.js to point to your Render backend URL" -ForegroundColor White
Write-Host "Example: https://your-app-name.onrender.com" -ForegroundColor White
Write-Host ""

Write-Host "✅ Deployment script complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Post-deployment checklist:" -ForegroundColor Cyan
Write-Host "1. ✓ Update Netlify site settings with correct API proxy rules" -ForegroundColor White
Write-Host "2. ✓ Verify Render environment variables are set correctly" -ForegroundColor White
Write-Host "3. ✓ Test authentication functionality" -ForegroundColor White
Write-Host "4. ✓ Test agent mode functionality" -ForegroundColor White
Write-Host "5. ✓ Verify SSE streaming works across domains" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Your application should now be available at:" -ForegroundColor Green
Write-Host "   Frontend: https://your-netlify-app.netlify.app" -ForegroundColor White
Write-Host "   Backend:  https://your-render-app.onrender.com" -ForegroundColor White
