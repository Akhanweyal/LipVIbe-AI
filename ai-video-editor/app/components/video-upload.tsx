
'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Video, Music, FileVideo, X, CheckCircle, Image, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface VideoUploadProps {
  onFileUpload: (file: File, type: 'video' | 'audio' | 'image') => void;
  currentProject: any;
  uploadedFiles: {
    image?: File;
    video?: File;
    audio?: File;
  };
}

export function VideoUpload({ onFileUpload, currentProject, uploadedFiles }: VideoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<{
    image?: string;
    video?: string;
    audio?: string;
  }>({});
  const [playingMedia, setPlayingMedia] = useState<{
    video?: boolean;
    audio?: boolean;
  }>({});
  const [mediaVolume, setMediaVolume] = useState<{
    video?: boolean;
    audio?: boolean;
  }>({});
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const getFileType = (file: File): 'video' | 'audio' | 'image' | null => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('image/')) return 'image';
    return null;
  };

  const handleFileUpload = async (file: File) => {
    if (!currentProject) {
      toast({
        title: "No Project Selected",
        description: "Please create or select a project first.",
        variant: "destructive",
      });
      return;
    }

    const fileType = getFileType(file);
    
    if (!fileType) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a video, audio, or image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB limit for browser processing)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 50MB for optimal browser-based processing.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', currentProject.id);
      formData.append('type', fileType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      setUploadProgress(100);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrls(prev => ({
        ...prev,
        [fileType]: previewUrl
      }));

      onFileUpload(file, fileType);

      toast({
        title: "Upload Successful",
        description: `${fileType} file uploaded successfully.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (type: 'video' | 'audio' | 'image') => {
    // Revoke the preview URL to free memory
    if (previewUrls[type]) {
      URL.revokeObjectURL(previewUrls[type]!);
    }
    
    setPreviewUrls(prev => {
      const updated = { ...prev };
      delete updated[type];
      return updated;
    });

    // Reset media state
    setPlayingMedia(prev => {
      const updated = { ...prev };
      delete updated[type as 'video' | 'audio'];
      return updated;
    });
  };

  const toggleMediaPlayback = (type: 'video' | 'audio') => {
    const mediaElement = type === 'video' ? videoRef.current : audioRef.current;
    if (!mediaElement) return;

    if (playingMedia[type]) {
      mediaElement.pause();
    } else {
      mediaElement.play();
    }
    
    setPlayingMedia(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const toggleMediaMute = (type: 'video' | 'audio') => {
    const mediaElement = type === 'video' ? videoRef.current : audioRef.current;
    if (!mediaElement) return;

    mediaElement.muted = !mediaElement.muted;
    setMediaVolume(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!currentProject) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <Card className="max-w-md mx-auto bg-yellow-900/20 border-yellow-500/30">
          <CardContent className="pt-6">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Project Selected</h3>
            <p className="text-gray-300 text-sm">
              Please create or select a project from the header to start uploading files.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-black/20 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Upload className="w-5 h-5" />
              <span>Upload Media Files</span>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                Step 1
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Upload your content files to get started. Supports images, videos, and audio files.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`upload-area rounded-lg p-8 text-center transition-all duration-200 border-2 border-dashed ${
                dragActive 
                  ? 'border-purple-400 bg-purple-500/10' 
                  : 'border-gray-600 hover:border-purple-400/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileVideo className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Drag & drop your files here
              </h3>
              <p className="text-gray-300 mb-4">
                Supports images (JPG, PNG), videos (MP4, MOV, WebM), and audio files (MP3, WAV)
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Maximum file size: 50MB (optimized for browser processing)
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                <Button
                  onClick={() => document.getElementById('video-upload')?.click()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
                <Button
                  onClick={() => document.getElementById('audio-upload')?.click()}
                  variant="outline"
                  className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
                >
                  <Music className="w-4 h-4 mr-2" />
                  Upload Audio
                </Button>
              </div>

              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              <input
                id="audio-upload"
                type="file"
                accept="audio/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
            </div>

            {isUploading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center animate-spin">
                    <Upload className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white font-medium">Uploading...</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-gray-400 mt-1">{uploadProgress}% complete</p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Uploaded Files with Previews */}
      {Object.keys(uploadedFiles).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-black/20 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Uploaded Files</span>
                <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                  {Object.keys(uploadedFiles).length} file{Object.keys(uploadedFiles).length > 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Preview */}
              {uploadedFiles.image && previewUrls.image && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Image className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="font-medium text-white">{uploadedFiles.image.name}</p>
                        <p className="text-sm text-gray-300">
                          {(uploadedFiles.image.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile('image')}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    <img
                      src={previewUrls.image}
                      alt="Uploaded image"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Video Preview */}
              {uploadedFiles.video && previewUrls.video && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Video className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="font-medium text-white">{uploadedFiles.video.name}</p>
                        <p className="text-sm text-gray-300">
                          {(uploadedFiles.video.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMediaPlayback('video')}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        {playingMedia.video ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMediaMute('video')}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        {mediaVolume.video ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile('video')}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      src={previewUrls.video}
                      className="w-full h-full object-contain"
                      controls
                      onPlay={() => setPlayingMedia(prev => ({ ...prev, video: true }))}
                      onPause={() => setPlayingMedia(prev => ({ ...prev, video: false }))}
                    />
                  </div>
                </div>
              )}

              {/* Audio Preview */}
              {uploadedFiles.audio && previewUrls.audio && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Music className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="font-medium text-white">{uploadedFiles.audio.name}</p>
                        <p className="text-sm text-gray-300">
                          {(uploadedFiles.audio.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMediaPlayback('audio')}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {playingMedia.audio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMediaMute('audio')}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {mediaVolume.audio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile('audio')}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <audio
                      ref={audioRef}
                      src={previewUrls.audio}
                      className="w-full"
                      controls
                      onPlay={() => setPlayingMedia(prev => ({ ...prev, audio: true }))}
                      onPause={() => setPlayingMedia(prev => ({ ...prev, audio: false }))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-blue-900/20 border-blue-500/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-300 mb-3">💡 Upload Tips for Best Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <h4 className="font-medium text-blue-200 mb-2">For Lipsync Generation:</h4>
                <ul className="space-y-1">
                  <li>• Upload a clear portrait image (face visible)</li>
                  <li>• Add audio file with clear speech</li>
                  <li>• Avoid background noise in audio</li>
                  <li>• Image resolution: 512x512 or higher</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-200 mb-2">For Voice Transformation:</h4>
                <ul className="space-y-1">
                  <li>• Upload video or audio with clear speech</li>
                  <li>• Minimize background noise</li>
                  <li>• File size under 50MB for smooth processing</li>
                  <li>• Duration under 2 minutes recommended</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
