#!/bin/bash

# AI-Coder Deployment Script for Netlify and Render
# This script helps deploy the application to both platforms

echo "🚀 AI-Coder Deployment Script"
echo "=============================="

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
}

echo "📋 Checking prerequisites..."
check_tool "pnpm"
check_tool "git"

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "⚠️  Netlify CLI not found. Installing..."
    pnpm install -g netlify-cli
fi

# Check if Render CLI is installed
if ! command -v render &> /dev/null; then
    echo "⚠️  Render CLI not found. Please install it from: https://render.com/docs/cli"
    echo "   You can skip Render CLI and deploy via web interface instead."
fi

echo "✅ Prerequisites check complete"
echo ""

# Build frontend assets
echo "🏗️  Building frontend assets..."
if [ ! -d "public" ]; then
    echo "❌ Public directory not found!"
    exit 1
fi

# Copy configuration file to root for both deployments
cp public/config.js ./ 2>/dev/null || echo "Config file already in root"

echo "✅ Frontend assets ready"
echo ""

# Deploy to Netlify (Frontend)
echo "📤 Deploying frontend to Netlify..."
echo "Please make sure you have:"
echo "1. Created a Netlify account"
echo "2. Connected your repository to Netlify"
echo "3. Set up the following build settings:"
echo "   - Build command: echo 'Static site - no build needed'"
echo "   - Publish directory: public"
echo ""

read -p "Do you want to deploy to Netlify now? (y/n): " deploy_netlify

if [ "$deploy_netlify" = "y" ] || [ "$deploy_netlify" = "Y" ]; then
    echo "🚀 Deploying to Netlify..."
    netlify deploy --prod --dir public
    echo "✅ Netlify deployment complete!"
    echo ""
else
    echo "⏭️  Skipping Netlify deployment"
    echo "   You can deploy later using: netlify deploy --prod --dir public"
    echo ""
fi

# Deploy to Render (Backend)
echo "📤 Deploying backend to Render..."
echo "Please make sure you have:"
echo "1. Created a Render account"
echo "2. Created a PostgreSQL database on Render"
echo "3. Set up the following environment variables in Render:"
echo "   - NODE_ENV=production"
echo "   - GEMINI_API_KEY=your-gemini-key"
echo "   - OPENROUTER_API_KEY=your-openrouter-key"
echo "   - FIREBASE_PROJECT_ID=your-firebase-project-id"
echo "   - FIREBASE_CLIENT_EMAIL=your-firebase-email"
echo "   - FIREBASE_PRIVATE_KEY=your-firebase-private-key"
echo "   - FRONTEND_URL=https://your-netlify-app.netlify.app"
echo ""

read -p "Do you want to deploy to Render now? (y/n): " deploy_render

if [ "$deploy_render" = "y" ] || [ "$deploy_render" = "Y" ]; then
    if command -v render &> /dev/null; then
        echo "🚀 Deploying to Render..."
        render services deploy
        echo "✅ Render deployment complete!"
    else
        echo "ℹ️  Render CLI not available. Please deploy via web interface:"
        echo "   1. Go to https://dashboard.render.com/"
        echo "   2. Connect your repository"
        echo "   3. Use the render.yaml configuration"
    fi
    echo ""
else
    echo "⏭️  Skipping Render deployment"
    echo "   You can deploy later via Render dashboard"
    echo ""
fi

# Update frontend configuration
echo "🔧 Updating frontend configuration..."
echo "Make sure to update the API_BASE_URL in public/config.js to point to your Render backend URL"
echo "Example: https://your-app-name.onrender.com"
echo ""

echo "✅ Deployment script complete!"
echo ""
echo "📋 Post-deployment checklist:"
echo "1. ✓ Update Netlify site settings with correct API proxy rules"
echo "2. ✓ Verify Render environment variables are set correctly"
echo "3. ✓ Test authentication functionality"
echo "4. ✓ Test agent mode functionality"
echo "5. ✓ Verify SSE streaming works across domains"
echo ""
echo "🌐 Your application should now be available at:"
echo "   Frontend: https://your-netlify-app.netlify.app"
echo "   Backend:  https://your-render-app.onrender.com"
