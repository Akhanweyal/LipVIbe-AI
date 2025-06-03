
# AI Video Editor - Free Browser-Based Voice & Lipsync Tool

A completely free, privacy-first AI video editing application that runs entirely in your browser. No API costs, no data transmission, and no server dependencies.

## 🚀 Features

- **Voice Transformation**: Change voices in audio/video files with professional effects
- **Lipsync Generation**: Create talking videos from images and audio
- **Browser-Based Processing**: All processing happens locally in your browser
- **Privacy First**: No data leaves your device
- **Multiple Export Formats**: MP4, MOV, WebM for video; WAV, MP3 for audio
- **Real-time Preview**: See and hear results before export
- **Professional Effects**: Pitch shifting, reverb, echo, distortion, and more

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and Yarn package manager
- Modern web browser with Web Audio API support (Chrome, Firefox, Safari, Edge)
- Microphone access (optional, for recording features)

### Installation

1. **Download the Project**
   ```bash
   # If you have the project files locally:
   cd ai-video-editor
   
   # Or download as ZIP and extract
   ```

2. **Install Dependencies**
   ```bash
   cd app
   yarn install
   ```

3. **Start Development Server**
   ```bash
   yarn dev
   ```

4. **Open in Browser**
   - Navigate to `http://localhost:3000`
   - Allow microphone permissions when prompted (for recording features)

## 📁 Project Structure

```
ai-video-editor/
├── app/                          # Main application directory
│   ├── app/                      # Next.js app directory
│   │   ├── api/                  # API routes (upload, export)
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Main page component
│   ├── components/               # React components
│   │   ├── ui/                   # UI components (buttons, cards, etc.)
│   │   ├── video-upload.tsx      # File upload component
│   │   ├── voice-changer.tsx     # Voice transformation
│   │   ├── lipsync-generator.tsx # Lipsync generation
│   │   ├── video-preview.tsx     # Media preview
│   │   ├── export-options.tsx    # Export functionality
│   │   └── project-manager.tsx   # Project management
│   ├── lib/                      # Utility libraries
│   ├── hooks/                    # React hooks
│   ├── package.json              # Dependencies
│   └── ...config files
├── package.json                  # Workspace package file
├── yarn.lock                     # Dependency lock file
└── README.md                     # This file
```

## 🎯 How to Use

### 1. Create a Project
- Click "Create New Project" in the header
- Give your project a descriptive name

### 2. Upload Content
- **For Voice Transformation**: Upload video or audio files
- **For Lipsync Generation**: Upload an image (portrait) and audio file
- Supported formats: MP4, MOV, WebM, MP3, WAV, JPG, PNG
- Maximum file size: 50MB (for optimal browser processing)

### 3. Choose Editing Type
- **Voice Transformation**: Change voice characteristics (pitch, gender, age, effects)
- **Lipsync Generation**: Create talking video from static image

### 4. Apply Effects
- Select voice transformation type or configure lipsync settings
- Preview effects in real-time
- Adjust parameters like pitch, speed, reverb, echo

### 5. Preview Results
- Compare original vs. processed content
- Use playback controls for detailed review
- Check audio sync and quality

### 6. Export & Download
- Choose output format and quality
- Download processed files directly to your device

## 🔧 Browser Permissions

The application requires certain browser permissions for full functionality:

### Microphone Access
- **Required for**: Recording audio, voice previews
- **How to enable**: Click "Allow" when prompted, or enable in browser settings
- **Privacy**: Audio is processed locally, never transmitted

### Audio Playback
- **Required for**: Playing uploaded files and previews
- **Usually automatic**: Most browsers allow audio playback by default
- **Troubleshooting**: If audio doesn't play, check browser audio settings

## 📥 Downloading Your Project

### Option 1: Individual File Downloads
- Use the download buttons in the export section
- Files are saved directly to your browser's download folder

### Option 2: Complete Project Download
To download the entire project for future development:

```bash
# Create a ZIP archive of the project
cd /path/to/ai-video-editor
zip -r ai-video-editor-project.zip . -x "node_modules/*" ".next/*" "*.log"

# Or use tar
tar -czf ai-video-editor-project.tar.gz --exclude=node_modules --exclude=.next --exclude="*.log" .
```

### Option 3: Git Repository (if using version control)
```bash
git clone <your-repository-url>
cd ai-video-editor
yarn install
yarn dev
```

## 🚀 Deployment Options

### Local Development
```bash
yarn dev          # Development server (http://localhost:3000)
```

### Production Build
```bash
yarn build        # Build for production
yarn start        # Start production server
```

### Static Export (Optional)
```bash
# Add to package.json scripts:
"export": "next build && next export"

yarn export       # Generate static files in 'out' directory
```

## 🔧 Troubleshooting

### Common Issues

1. **"Cannot read properties of null (reading 'duration')" Error**
   - **Fixed**: Added comprehensive null checks for media elements
   - **Solution**: Refresh the page if you encounter this error

2. **Audio Not Playing**
   - Check browser audio permissions
   - Ensure audio files are not corrupted
   - Try a different browser (Chrome recommended)

3. **Microphone Access Denied**
   - Click the microphone icon in browser address bar
   - Select "Always allow" for this site
   - Restart browser if needed

4. **File Upload Fails**
   - Check file size (must be under 50MB)
   - Ensure file format is supported
   - Try a different file

5. **Processing Stuck**
   - Refresh the page and try again
   - Check browser console for errors (F12)
   - Ensure sufficient RAM available

### Browser Compatibility

| Browser | Voice Transform | Lipsync | Recording | Notes |
|---------|----------------|---------|-----------|-------|
| Chrome 90+ | ✅ | ✅ | ✅ | Recommended |
| Firefox 88+ | ✅ | ✅ | ✅ | Full support |
| Safari 14+ | ✅ | ✅ | ⚠️ | Limited recording |
| Edge 90+ | ✅ | ✅ | ✅ | Full support |

## 🔒 Privacy & Security

- **No Data Transmission**: All processing happens in your browser
- **No Server Storage**: Files are not uploaded to any server
- **Local Processing**: Uses Web Audio API and Canvas API
- **No Tracking**: No analytics or user tracking
- **Open Source**: Code is transparent and auditable

## 📋 Technical Requirements

### Minimum System Requirements
- **RAM**: 4GB (8GB recommended for large files)
- **Browser**: Modern browser with Web Audio API support
- **Storage**: 1GB free space for temporary processing
- **Internet**: Only required for initial page load

### Recommended Specifications
- **RAM**: 8GB or more
- **CPU**: Multi-core processor for faster processing
- **Browser**: Latest Chrome or Firefox
- **Audio**: Dedicated sound card for better audio quality

## 🆘 Support & Issues

### Getting Help
1. Check this README for common solutions
2. Open browser developer tools (F12) to check for errors
3. Try refreshing the page or restarting the browser
4. Test with a smaller file size

### Reporting Issues
When reporting issues, please include:
- Browser name and version
- Operating system
- File types and sizes being used
- Error messages from browser console
- Steps to reproduce the issue

## 🔄 Updates & Maintenance

### Keeping Updated
- Pull latest changes if using Git
- Run `yarn install` to update dependencies
- Check for browser updates regularly

### Performance Optimization
- Close other browser tabs during processing
- Use smaller file sizes when possible
- Clear browser cache if experiencing issues
- Restart browser periodically for best performance

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with Next.js 14 and React 18
- Uses Web Audio API for audio processing
- Styled with Tailwind CSS
- Icons by Lucide React
- UI components by Radix UI

---

**Note**: This application is designed for educational and personal use. For commercial applications, please ensure compliance with relevant audio/video processing regulations in your jurisdiction.
