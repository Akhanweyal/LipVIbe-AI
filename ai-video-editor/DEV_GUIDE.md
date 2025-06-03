
# AI Video Editor - Development Guide

## Project Overview
This AI Video Editor is a modern web application built with cutting-edge technologies for video processing, AI-powered features, and real-time editing capabilities.

## Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Modern UI component library
- **React**: Component-based UI library

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **Prisma**: Database ORM and query builder
- **SQLite**: Local database (development)

### AI & Media Processing
- **FFmpeg**: Video processing and conversion
- **Web APIs**: MediaRecorder, Canvas, WebRTC
- **File Upload**: Drag-and-drop with progress tracking

## Project Structure

```
ai-video-editor/
├── .abacus.donotdelete          # Abacus.AI deployment marker
├── .deploy/                     # Deployment artifacts
├── .logs/                       # Application logs
├── README.md                    # Project documentation
├── app/                         # Main application directory
│   ├── .build/                  # Build output (generated)
│   ├── .env                     # Environment variables
│   ├── .next/                   # Next.js build cache (generated)
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API routes
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout component
│   │   └── page.tsx             # Home page component
│   ├── components/              # React components
│   │   ├── export-options.tsx   # Video export functionality
│   │   ├── lipsync-generator.tsx # AI lip-sync features
│   │   ├── permission-manager.tsx # File permissions
│   │   ├── project-manager.tsx  # Project management
│   │   ├── theme-provider.tsx   # Dark/light theme
│   │   ├── ui/                  # Shadcn/ui components
│   │   ├── video-preview.tsx    # Video player component
│   │   ├── video-upload.tsx     # File upload component
│   │   └── voice-changer.tsx    # Voice modification
│   ├── components.json          # Shadcn/ui configuration
│   ├── hooks/                   # Custom React hooks
│   │   └── use-toast.ts         # Toast notifications
│   ├── lib/                     # Utility libraries
│   │   ├── db/                  # Database utilities
│   │   ├── db.ts                # Database connection
│   │   ├── types.ts             # TypeScript type definitions
│   │   └── utils.ts             # Helper functions
│   ├── next-env.d.ts            # Next.js TypeScript declarations
│   ├── next.config.js           # Next.js configuration
│   ├── package.json             # Dependencies and scripts
│   ├── postcss.config.js        # PostCSS configuration
│   ├── prisma/                  # Database schema and migrations
│   │   └── schema.prisma        # Database schema definition
│   ├── tailwind.config.ts       # Tailwind CSS configuration
│   ├── tsconfig.json            # TypeScript configuration
│   └── uploads/                 # User uploaded files
├── node_modules -> /opt/hostedapp/node/root/node_modules  # Dependencies (symlink)
├── package.json -> /opt/hostedapp/node/root/package.json  # Root package.json (symlink)
└── yarn.lock -> /opt/hostedapp/node/root/yarn.lock        # Dependency lock file (symlink)
```

## Development Workflow

### Local Development
1. **Start the development server**
   ```bash
   cd app
   npm run dev
   ```
   - Server runs on `http://localhost:3000`
   - Hot reload enabled for instant updates
   - TypeScript compilation in watch mode

2. **Database development**
   ```bash
   # View database in browser
   npx prisma studio
   
   # Reset database
   npx prisma db push --force-reset
   
   # Generate Prisma client after schema changes
   npx prisma generate
   ```

3. **Code formatting and linting**
   ```bash
   # Format code
   npm run format
   
   # Lint code
   npm run lint
   
   # Fix linting issues
   npm run lint:fix
   ```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run dev:turbo    # Start with Turbopack (faster)

# Building
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

### Environment Variables

Create `.env.local` in the `app/` directory:

```env
# Required
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-development-secret"
NEXTAUTH_URL="http://localhost:3000"

# Optional - AI Features
OPENAI_API_KEY="sk-..."           # For AI-powered features
ELEVENLABS_API_KEY="..."          # For voice synthesis

# Optional - File Upload
MAX_FILE_SIZE="100MB"             # Maximum upload size
UPLOAD_DIR="./uploads"            # Upload directory

# Optional - Development
NODE_ENV="development"
DEBUG="true"
```

## Key Components

### 1. Video Upload (`components/video-upload.tsx`)
- Drag-and-drop file upload
- Progress tracking
- File validation
- Multiple format support

### 2. Video Preview (`components/video-preview.tsx`)
- HTML5 video player
- Custom controls
- Timeline scrubbing
- Playback speed control

### 3. Voice Changer (`components/voice-changer.tsx`)
- Real-time voice modification
- Audio processing
- Effect presets
- Export functionality

### 4. Lip Sync Generator (`components/lipsync-generator.tsx`)
- AI-powered lip synchronization
- Audio-visual alignment
- Processing pipeline
- Quality controls

### 5. Project Manager (`components/project-manager.tsx`)
- Save/load projects
- Version control
- Export options
- Collaboration features

## API Routes

### File Management
- `POST /api/upload` - Upload video files
- `GET /api/files` - List uploaded files
- `DELETE /api/files/[id]` - Delete files

### Video Processing
- `POST /api/process/voice-change` - Apply voice effects
- `POST /api/process/lipsync` - Generate lip sync
- `POST /api/process/export` - Export final video

### Project Management
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

## Database Schema

The application uses Prisma with SQLite for development. Key models:

```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  settings    Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  files       File[]
}

model File {
  id        String   @id @default(cuid())
  filename  String
  path      String
  size      Int
  mimeType  String
  projectId String?
  project   Project? @relation(fields: [projectId], references: [id])
  createdAt DateTime @default(now())
}
```

## Deployment

### Production Build
```bash
cd app
npm run build
npm start
```

### Environment Setup for Production
```env
NODE_ENV="production"
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
```

### Docker Deployment (Optional)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY app/package*.json ./
RUN npm ci --only=production
COPY app/ .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Performance Considerations

### Video Processing
- Use Web Workers for heavy computations
- Implement chunked file uploads for large videos
- Cache processed results
- Optimize FFmpeg parameters

### Frontend Optimization
- Lazy load components
- Implement virtual scrolling for large lists
- Use React.memo for expensive components
- Optimize bundle size with dynamic imports

### Database Optimization
- Index frequently queried fields
- Use database connection pooling
- Implement proper caching strategies
- Regular database maintenance

## Testing

### Unit Tests
```bash
npm run test
npm run test:watch
npm run test:coverage
```

### E2E Tests
```bash
npm run test:e2e
```

### Manual Testing Checklist
- [ ] File upload functionality
- [ ] Video playback and controls
- [ ] Voice changing effects
- [ ] Lip sync generation
- [ ] Project save/load
- [ ] Export functionality
- [ ] Responsive design
- [ ] Cross-browser compatibility

## Contributing

### Code Style
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add JSDoc comments for complex functions

### Pull Request Process
1. Create feature branch from main
2. Implement changes with tests
3. Update documentation if needed
4. Submit pull request with description

## Troubleshooting Development Issues

### Common Development Problems

1. **TypeScript Errors**
   - Run `npm run type-check` to see all errors
   - Check `tsconfig.json` configuration
   - Ensure all dependencies have type definitions

2. **Database Issues**
   - Reset database: `npx prisma db push --force-reset`
   - Check schema syntax in `prisma/schema.prisma`
   - Verify DATABASE_URL in environment

3. **Build Failures**
   - Clear Next.js cache: `rm -rf .next`
   - Check for circular dependencies
   - Verify all imports are correct

4. **Performance Issues**
   - Use React DevTools Profiler
   - Check for memory leaks
   - Optimize large video file handling

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Support

For development support:
1. Check the troubleshooting section above
2. Review the `.logs` directory for error details
3. Use browser developer tools for frontend debugging
4. Check database state with Prisma Studio
