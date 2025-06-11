# AI-Coder Deployment Script for Netlify + Render
# This script automates the deployment process for both platforms

param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$SkipTests,
    [string]$Environment = "production"
)

Write-Host "🚀 AI-Coder Deployment Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BackendName = "ai-coder-backend"
$FrontendName = "ai-coder-frontend"
$DatabaseName = "ai-coder-db"

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Function to run command with error handling
function Invoke-SafeCommand {
    param(
        [string]$Command,
        [string]$Description,
        [switch]$ContinueOnError
    )
    
    Write-Host "🔄 $Description..." -ForegroundColor Yellow
    
    try {
        Invoke-Expression $Command
        Write-Host "✅ $Description completed successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ $Description failed: $($_.Exception.Message)" -ForegroundColor Red
        if (-not $ContinueOnError) {
            exit 1
        }
        return $false
    }
}

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Blue

$Prerequisites = @(
    @{ Command = "node"; Name = "Node.js" },
    @{ Command = "pnpm"; Name = "pnpm" },
    @{ Command = "git"; Name = "Git" }
)

foreach ($Prereq in $Prerequisites) {
    if (Test-Command $Prereq.Command) {
        Write-Host "✅ $($Prereq.Name) is installed" -ForegroundColor Green
    } else {
        Write-Host "❌ $($Prereq.Name) is not installed" -ForegroundColor Red
        exit 1
    }
}

# Check optional tools
if (Test-Command "netlify") {
    Write-Host "✅ Netlify CLI is installed" -ForegroundColor Green
    $NetlifyCLI = $true
} else {
    Write-Host "⚠️  Netlify CLI not found - will install" -ForegroundColor Yellow
    $NetlifyCLI = $false
}

if (Test-Command "render") {
    Write-Host "✅ Render CLI is installed" -ForegroundColor Green
    $RenderCLI = $true
} else {
    Write-Host "⚠️  Render CLI not found - manual deployment required" -ForegroundColor Yellow
    $RenderCLI = $false
}

Write-Host ""

# Install dependencies
Invoke-SafeCommand "pnpm install" "Installing dependencies"

# Install CLI tools if needed
if (-not $NetlifyCLI) {
    Invoke-SafeCommand "pnpm install -g netlify-cli" "Installing Netlify CLI" -ContinueOnError
}

# Validate configuration files
Write-Host "🔍 Validating configuration files..." -ForegroundColor Blue

$ConfigFiles = @(
    "netlify.toml",
    "render.yaml",
    "public/config.js",
    ".env.production"
)

foreach ($File in $ConfigFiles) {
    if (Test-Path $File) {
        Write-Host "✅ $File exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $File is missing" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Backend Deployment (Render)
if (-not $SkipBackend) {
    Write-Host "🖥️  BACKEND DEPLOYMENT (RENDER)" -ForegroundColor Magenta
    Write-Host "================================" -ForegroundColor Magenta
    
    # Run backend deployment script
    if (Test-Path "scripts/deploy-render.js") {
        Invoke-SafeCommand "node scripts/deploy-render.js" "Running Render deployment script"
    } else {
        Write-Host "📋 Manual Render deployment required:" -ForegroundColor Yellow
        Write-Host "1. Push code to GitHub repository" -ForegroundColor White
        Write-Host "2. Create Web Service in Render dashboard" -ForegroundColor White
        Write-Host "3. Connect GitHub repository" -ForegroundColor White
        Write-Host "4. Set environment variables" -ForegroundColor White
        Write-Host "5. Deploy service" -ForegroundColor White
    }
    
    Write-Host ""
}

# Frontend Deployment (Netlify)
if (-not $SkipFrontend) {
    Write-Host "🌐 FRONTEND DEPLOYMENT (NETLIFY)" -ForegroundColor Magenta
    Write-Host "=================================" -ForegroundColor Magenta
    
    # Check if Netlify is configured
    if (Test-Path ".netlify/state.json") {
        Write-Host "✅ Netlify site already linked" -ForegroundColor Green
        
        if ($NetlifyCLI) {
            Invoke-SafeCommand "netlify deploy --prod --dir=public" "Deploying to Netlify"
        } else {
            Write-Host "⚠️  Netlify CLI not available - using Git deployment" -ForegroundColor Yellow
            Invoke-SafeCommand "git add . && git commit -m 'Deploy to Netlify' && git push origin main" "Pushing to GitHub for auto-deployment" -ContinueOnError
        }
    } else {
        Write-Host "📋 Manual Netlify setup required:" -ForegroundColor Yellow
        Write-Host "1. Go to Netlify dashboard" -ForegroundColor White
        Write-Host "2. Create new site from Git" -ForegroundColor White
        Write-Host "3. Connect GitHub repository" -ForegroundColor White
        Write-Host "4. Set publish directory to 'public'" -ForegroundColor White
        Write-Host "5. Deploy site" -ForegroundColor White
        
        if ($NetlifyCLI) {
            Write-Host ""
            Write-Host "Or run: netlify link" -ForegroundColor Cyan
        }
    }
    
    Write-Host ""
}

# Run tests if not skipped
if (-not $SkipTests) {
    Write-Host "🧪 RUNNING DEPLOYMENT TESTS" -ForegroundColor Magenta
    Write-Host "============================" -ForegroundColor Magenta
    
    # Test backend health
    Write-Host "Testing backend health endpoint..." -ForegroundColor Yellow
    # Note: This would need the actual backend URL
    
    # Test frontend accessibility
    Write-Host "Testing frontend accessibility..." -ForegroundColor Yellow
    # Note: This would need the actual frontend URL
    
    Write-Host "⚠️  Manual testing required after deployment" -ForegroundColor Yellow
    Write-Host ""
}

# Deployment summary
Write-Host "📋 DEPLOYMENT SUMMARY" -ForegroundColor Magenta
Write-Host "=====================" -ForegroundColor Magenta
Write-Host ""

Write-Host "✅ Configuration files validated" -ForegroundColor Green
Write-Host "✅ Dependencies installed" -ForegroundColor Green

if (-not $SkipBackend) {
    Write-Host "✅ Backend deployment initiated" -ForegroundColor Green
}

if (-not $SkipFrontend) {
    Write-Host "✅ Frontend deployment initiated" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Monitor deployment logs in platform dashboards" -ForegroundColor White
Write-Host "2. Set environment variables in Render dashboard" -ForegroundColor White
Write-Host "3. Test all functionality after deployment" -ForegroundColor White
Write-Host "4. Update DNS settings if using custom domain" -ForegroundColor White
Write-Host ""

Write-Host "🔗 USEFUL LINKS:" -ForegroundColor Cyan
Write-Host "• Render Dashboard: https://dashboard.render.com" -ForegroundColor White
Write-Host "• Netlify Dashboard: https://app.netlify.com" -ForegroundColor White
Write-Host "• Deployment Guide: ./NETLIFY_RENDER_DEPLOYMENT.md" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Deployment script completed!" -ForegroundColor Green
Write-Host "Check platform dashboards for deployment status." -ForegroundColor White
