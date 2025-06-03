
# AI Video Editor - Setup Instructions

## Overview
This is a comprehensive AI-powered video editing web application built with Next.js, featuring voice changing, lip-sync generation, and advanced video processing capabilities.

## System Requirements

### Minimum Requirements
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (or yarn 1.22+)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space minimum
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

### Recommended Requirements
- **Node.js**: Version 20.0 or higher
- **RAM**: 16GB for optimal performance
- **Storage**: 10GB+ for video processing
- **GPU**: Dedicated GPU for faster video processing (optional)

## Installation Guide

### Step 1: Prerequisites
1. **Install Node.js**
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`

2. **Install Git** (if not already installed)
   - Download from [git-scm.com](https://git-scm.com/)

### Step 2: Project Setup
1. **Extract the project**
   ```bash
   unzip ai-video-editor.zip
   cd ai-video-editor
   ```

2. **Navigate to the app directory**
   ```bash
   cd app
   ```

3. **Install dependencies**
   ```bash
   npm install
   # or if you prefer yarn
   yarn install
   ```

### Step 3: Environment Configuration
1. **Create environment file**
   ```bash
   cp .env.example .env.local
   # or create .env.local manually
   ```

2. **Configure environment variables** (edit `.env.local`):
   ```env
   # Database
   DATABASE_URL="file:./dev.db"
   
   # Next.js
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Optional: External API keys for enhanced features
   OPENAI_API_KEY="your-openai-key" # For AI features
   ELEVENLABS_API_KEY="your-elevenlabs-key" # For voice synthesis
   ```

### Step 4: Database Setup
1. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

2. **Verify database setup**
   ```bash
   npx prisma studio
   ```
   This opens a web interface to view your database at `http://localhost:5555`

### Step 5: Run the Application
1. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - The application should load successfully

## Troubleshooting

### Common Issues

#### 1. Node.js Version Issues
**Problem**: "Node.js version not supported"
**Solution**: 
- Update Node.js to version 18+ from [nodejs.org](https://nodejs.org/)
- Use nvm to manage multiple Node.js versions:
  ```bash
  nvm install 20
  nvm use 20
  ```

#### 2. Package Installation Failures
**Problem**: npm install fails with permission errors
**Solution**:
- On macOS/Linux: Use `sudo npm install` (not recommended) or fix npm permissions
- Better solution: Use nvm or configure npm properly
- On Windows: Run terminal as Administrator

#### 3. Database Connection Issues
**Problem**: Prisma database errors
**Solution**:
```bash
# Reset and regenerate database
rm -rf prisma/dev.db
npx prisma generate
npx prisma db push
```

#### 4. Port Already in Use
**Problem**: "Port 3000 is already in use"
**Solution**:
- Kill the process using port 3000:
  ```bash
  # On macOS/Linux
  lsof -ti:3000 | xargs kill -9
  
  # On Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```
- Or use a different port:
  ```bash
  npm run dev -- -p 3001
  ```

#### 5. Memory Issues
**Problem**: Out of memory errors during build
**Solution**:
- Increase Node.js memory limit:
  ```bash
  export NODE_OPTIONS="--max-old-space-size=4096"
  npm run build
  ```

#### 6. Video Upload Issues
**Problem**: Large video files fail to upload
**Solution**:
- Check file size limits in `next.config.js`
- Ensure sufficient disk space
- Verify upload directory permissions

### Performance Optimization

#### For Development
- Use `npm run dev` with turbopack for faster builds:
  ```bash
  npm run dev -- --turbo
  ```

#### For Production
- Build and start production server:
  ```bash
  npm run build
  npm start
  ```

### Getting Help

1. **Check the logs**: Look in the `.logs` directory for error details
2. **Browser Console**: Open developer tools (F12) to check for JavaScript errors
3. **Network Tab**: Check for failed API requests
4. **Database Issues**: Use `npx prisma studio` to inspect database state

## Next Steps
After successful setup, refer to `DEV_GUIDE.md` for development instructions and project structure details.
