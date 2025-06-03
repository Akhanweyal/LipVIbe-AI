
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Download, Share2, Maximize, SkipBack, SkipForward, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface VideoPreviewProps {
  currentProject: any;
  uploadedFiles: {
    image?: File;
    video?: File;
    audio?: File;
  };
  editingType: 'lipsync' | 'voice' | null;
}

export function VideoPreview({ currentProject, uploadedFiles, editingType }: VideoPreviewProps) {
  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const originalAudioRef = useRef<HTMLAudioElement>(null);
  const processedVideoRef = useRef<HTMLVideoElement>(null);
  const processedAudioRef = useRef<HTMLAudioElement>(null);
  
  const [isPlaying, setIsPlaying] = useState<{
    original?: boolean;
    processed?: boolean;
  }>({});
  const [isMuted, setIsMuted] = useState<{
    original?: boolean;
    processed?: boolean;
  }>({});
  const [currentTime, setCurrentTime] = useState<{
    original?: number;
    processed?: number;
  }>({});
  const [duration, setDuration] = useState<{
    original?: number;
    processed?: number;
  }>({});
  const [volume, setVolume] = useState<{
    original?: number[];
    processed?: number[];
  }>({
    original: [1],
    processed: [1]
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('original');
  const [showComparison, setShowComparison] = useState(false);
  const [originalMediaUrl, setOriginalMediaUrl] = useState<string | null>(null);
  const [processedMediaUrl, setProcessedMediaUrl] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Safe event handlers with null checks
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLMediaElement>, type: 'original' | 'processed') => {
    try {
      const target = e.currentTarget;
      if (target && typeof target.currentTime === 'number' && !isNaN(target.currentTime)) {
        setCurrentTime(prev => ({ ...prev, [type]: target.currentTime }));
      }
    } catch (error) {
      console.warn('Time update error:', error);
    }
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLMediaElement>, type: 'original' | 'processed') => {
    try {
      const target = e.currentTarget;
      if (target && typeof target.duration === 'number' && !isNaN(target.duration) && target.duration > 0) {
        setDuration(prev => ({ ...prev, [type]: target.duration }));
        setMediaError(null);
      }
    } catch (error) {
      console.warn('Metadata load error:', error);
      setMediaError('Failed to load media metadata');
    }
  };

  const handleMediaError = (e: React.SyntheticEvent<HTMLMediaElement>, type: 'original' | 'processed') => {
    console.error('Media error:', e);
    setMediaError(`Failed to load ${type} media`);
    toast({
      title: "Media Error",
      description: `Failed to load ${type} media. Please try uploading again.`,
      variant: "destructive",
    });
  };

  useEffect(() => {
    // Set up original media URLs based on uploaded files and editing type
    try {
      if (editingType === 'voice') {
        if (uploadedFiles.video) {
          setOriginalMediaUrl(URL.createObjectURL(uploadedFiles.video));
        } else if (uploadedFiles.audio) {
          setOriginalMediaUrl(URL.createObjectURL(uploadedFiles.audio));
        }
      } else if (editingType === 'lipsync') {
        if (uploadedFiles.image) {
          setOriginalMediaUrl(URL.createObjectURL(uploadedFiles.image));
        }
      }

      // Mock processed media URL (in real implementation, this would come from processing results)
      if (currentProject?.processedVideoPath || currentProject?.processedAudioPath) {
        setProcessedMediaUrl(`/processed/${currentProject.id}/final-output.${editingType === 'voice' ? 'wav' : 'mp4'}`);
      }
    } catch (error) {
      console.error('Error setting up media URLs:', error);
      setMediaError('Failed to set up media preview');
    }

    return () => {
      // Cleanup URLs
      if (originalMediaUrl && originalMediaUrl.startsWith('blob:')) {
        URL.revokeObjectURL(originalMediaUrl);
      }
      if (processedMediaUrl && processedMediaUrl.startsWith('blob:')) {
        URL.revokeObjectURL(processedMediaUrl);
      }
    };
  }, [uploadedFiles, editingType, currentProject]);

  const togglePlayPause = (type: 'original' | 'processed') => {
    try {
      const isVideo = editingType === 'lipsync' || (editingType === 'voice' && uploadedFiles.video);
      const mediaElement = type === 'original' 
        ? (isVideo ? originalVideoRef.current : originalAudioRef.current)
        : (isVideo ? processedVideoRef.current : processedAudioRef.current);
      
      if (!mediaElement) {
        console.warn(`Media element not found for ${type}`);
        return;
      }

      if (isPlaying[type]) {
        mediaElement.pause();
      } else {
        // Pause the other media element
        const otherType = type === 'original' ? 'processed' : 'original';
        const otherElement = otherType === 'original'
          ? (isVideo ? originalVideoRef.current : originalAudioRef.current)
          : (isVideo ? processedVideoRef.current : processedAudioRef.current);
        
        if (otherElement) {
          otherElement.pause();
          setIsPlaying(prev => ({ ...prev, [otherType]: false }));
        }
        
        mediaElement.play().catch(error => {
          console.error('Play error:', error);
          toast({
            title: "Playback Error",
            description: "Failed to play media. Please check your browser permissions.",
            variant: "destructive",
          });
        });
      }
      
      setIsPlaying(prev => ({ ...prev, [type]: !prev[type] }));
    } catch (error) {
      console.error('Toggle play/pause error:', error);
    }
  };

  const toggleMute = (type: 'original' | 'processed') => {
    try {
      const isVideo = editingType === 'lipsync' || (editingType === 'voice' && uploadedFiles.video);
      const mediaElement = type === 'original' 
        ? (isVideo ? originalVideoRef.current : originalAudioRef.current)
        : (isVideo ? processedVideoRef.current : processedAudioRef.current);
      
      if (!mediaElement) return;

      mediaElement.muted = !mediaElement.muted;
      setIsMuted(prev => ({ ...prev, [type]: !prev[type] }));
    } catch (error) {
      console.error('Toggle mute error:', error);
    }
  };

  const handleSeek = (type: 'original' | 'processed', value: number[]) => {
    try {
      const isVideo = editingType === 'lipsync' || (editingType === 'voice' && uploadedFiles.video);
      const mediaElement = type === 'original' 
        ? (isVideo ? originalVideoRef.current : originalAudioRef.current)
        : (isVideo ? processedVideoRef.current : processedAudioRef.current);
      
      if (!mediaElement || !mediaElement.duration || isNaN(mediaElement.duration)) return;

      const seekTime = Math.max(0, Math.min(mediaElement.duration, value[0]));
      mediaElement.currentTime = seekTime;
      setCurrentTime(prev => ({ ...prev, [type]: seekTime }));
    } catch (error) {
      console.error('Seek error:', error);
    }
  };

  const handleVolumeChange = (type: 'original' | 'processed', value: number[]) => {
    try {
      const isVideo = editingType === 'lipsync' || (editingType === 'voice' && uploadedFiles.video);
      const mediaElement = type === 'original' 
        ? (isVideo ? originalVideoRef.current : originalAudioRef.current)
        : (isVideo ? processedVideoRef.current : processedAudioRef.current);
      
      if (!mediaElement) return;

      mediaElement.volume = Math.max(0, Math.min(1, value[0]));
      setVolume(prev => ({ ...prev, [type]: value }));
    } catch (error) {
      console.error('Volume change error:', error);
    }
  };

  const skipTime = (type: 'original' | 'processed', seconds: number) => {
    try {
      const isVideo = editingType === 'lipsync' || (editingType === 'voice' && uploadedFiles.video);
      const mediaElement = type === 'original' 
        ? (isVideo ? originalVideoRef.current : originalAudioRef.current)
        : (isVideo ? processedVideoRef.current : processedAudioRef.current);
      
      if (!mediaElement || !mediaElement.duration || isNaN(mediaElement.duration)) return;

      const newTime = Math.max(0, Math.min(mediaElement.duration, mediaElement.currentTime + seconds));
      mediaElement.currentTime = newTime;
    } catch (error) {
      console.error('Skip time error:', error);
    }
  };

  const toggleFullscreen = (type: 'original' | 'processed') => {
    try {
      const isVideo = editingType === 'lipsync' || (editingType === 'voice' && uploadedFiles.video);
      if (!isVideo) return;
      
      const videoElement = type === 'original' ? originalVideoRef.current : processedVideoRef.current;
      if (!videoElement) return;

      if (!isFullscreen) {
        if (videoElement.requestFullscreen) {
          videoElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    try {
      if (processedMediaUrl) {
        const link = document.createElement('a');
        link.href = processedMediaUrl;
        link.download = `processed-${editingType}-${Date.now()}.${editingType === 'voice' ? 'wav' : 'mp4'}`;
        link.click();
        
        toast({
          title: "Download Started",
          description: "Your processed media is being downloaded.",
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    try {
      if (navigator.share && processedMediaUrl) {
        navigator.share({
          title: 'AI Video Editor Result',
          text: `Check out my ${editingType} transformation!`,
          url: processedMediaUrl
        });
      } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Share Link Copied",
          description: "The share link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: "Share Failed",
        description: "Failed to share. Please try copying the URL manually.",
        variant: "destructive",
      });
    }
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
              <Play className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Project Selected</h3>
            <p className="text-gray-300 text-sm">
              Please create a project and process your content to see the preview.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const isVideo = editingType === 'lipsync' || (editingType === 'voice' && uploadedFiles.video);
  const hasProcessedContent = currentProject?.processedVideoPath || currentProject?.processedAudioPath;

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {mediaError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-red-900/20 border-red-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h3 className="font-medium text-red-300">Media Error</h3>
                  <p className="text-sm text-red-400">{mediaError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Preview Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-black/20 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Play className="w-5 h-5" />
              <span>Preview Results</span>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                Step 4: Preview
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Review your {editingType === 'voice' ? 'voice transformation' : 'lipsync generation'} results before export
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => setShowComparison(!showComparison)}
                  variant="outline"
                  className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
                >
                  {showComparison ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showComparison ? 'Hide' : 'Show'} Comparison
                </Button>
                
                {hasProcessedContent && (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    Processing Complete
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleDownload}
                  disabled={!hasProcessedContent}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={handleShare}
                  disabled={!hasProcessedContent}
                  variant="outline"
                  className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Media Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-black/20 backdrop-blur-md border-white/10">
          <CardContent className="p-0">
            {showComparison ? (
              /* Side-by-side comparison */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* Original */}
                <div className="space-y-4">
                  <h3 className="font-medium text-white flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span>Original {editingType === 'lipsync' ? 'Image' : (isVideo ? 'Video' : 'Audio')}</span>
                  </h3>
                  
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    {editingType === 'lipsync' && originalMediaUrl ? (
                      <img
                        src={originalMediaUrl}
                        alt="Original image"
                        className="w-full h-full object-contain"
                        onError={() => setMediaError('Failed to load original image')}
                      />
                    ) : isVideo && originalMediaUrl ? (
                      <video
                        ref={originalVideoRef}
                        src={originalMediaUrl}
                        className="w-full h-full object-contain"
                        onTimeUpdate={(e) => handleTimeUpdate(e, 'original')}
                        onLoadedMetadata={(e) => handleLoadedMetadata(e, 'original')}
                        onPlay={() => setIsPlaying(prev => ({ ...prev, original: true }))}
                        onPause={() => setIsPlaying(prev => ({ ...prev, original: false }))}
                        onError={(e) => handleMediaError(e, 'original')}
                      />
                    ) : originalMediaUrl ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <audio
                          ref={originalAudioRef}
                          src={originalMediaUrl}
                          className="w-full max-w-md"
                          controls
                          onTimeUpdate={(e) => handleTimeUpdate(e, 'original')}
                          onLoadedMetadata={(e) => handleLoadedMetadata(e, 'original')}
                          onPlay={() => setIsPlaying(prev => ({ ...prev, original: true }))}
                          onPause={() => setIsPlaying(prev => ({ ...prev, original: false }))}
                          onError={(e) => handleMediaError(e, 'original')}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <p className="text-gray-400">No original content</p>
                      </div>
                    )}

                    {/* Controls overlay for video */}
                    {isVideo && originalMediaUrl && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <div className="space-y-2">
                          <Slider
                            value={[currentTime.original || 0]}
                            onValueChange={(value) => handleSeek('original', value)}
                            max={duration.original || 100}
                            step={0.1}
                            className="w-full"
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                onClick={() => togglePlayPause('original')}
                                className="bg-white/20 hover:bg-white/30"
                              >
                                {isPlaying.original ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => toggleMute('original')}
                                className="bg-white/20 hover:bg-white/30"
                              >
                                {isMuted.original ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                              </Button>
                            </div>
                            <div className="text-xs text-white">
                              {formatTime(currentTime.original || 0)} / {formatTime(duration.original || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Processed */}
                <div className="space-y-4">
                  <h3 className="font-medium text-white flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span>Processed {editingType === 'lipsync' ? 'Video' : (isVideo ? 'Video' : 'Audio')}</span>
                  </h3>
                  
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    {hasProcessedContent ? (
                      isVideo ? (
                        <video
                          ref={processedVideoRef}
                          src={processedMediaUrl || ''}
                          className="w-full h-full object-contain"
                          onTimeUpdate={(e) => handleTimeUpdate(e, 'processed')}
                          onLoadedMetadata={(e) => handleLoadedMetadata(e, 'processed')}
                          onPlay={() => setIsPlaying(prev => ({ ...prev, processed: true }))}
                          onPause={() => setIsPlaying(prev => ({ ...prev, processed: false }))}
                          onError={(e) => handleMediaError(e, 'processed')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                          <audio
                            ref={processedAudioRef}
                            src={processedMediaUrl || ''}
                            className="w-full max-w-md"
                            controls
                            onTimeUpdate={(e) => handleTimeUpdate(e, 'processed')}
                            onLoadedMetadata={(e) => handleLoadedMetadata(e, 'processed')}
                            onPlay={() => setIsPlaying(prev => ({ ...prev, processed: true }))}
                            onPause={() => setIsPlaying(prev => ({ ...prev, processed: false }))}
                            onError={(e) => handleMediaError(e, 'processed')}
                          />
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <div className="text-center">
                          <RotateCcw className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                          <p className="text-gray-400">Processing in progress...</p>
                        </div>
                      </div>
                    )}

                    {/* Controls overlay for processed video */}
                    {isVideo && hasProcessedContent && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <div className="space-y-2">
                          <Slider
                            value={[currentTime.processed || 0]}
                            onValueChange={(value) => handleSeek('processed', value)}
                            max={duration.processed || 100}
                            step={0.1}
                            className="w-full"
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                onClick={() => togglePlayPause('processed')}
                                className="bg-white/20 hover:bg-white/30"
                              >
                                {isPlaying.processed ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => toggleMute('processed')}
                                className="bg-white/20 hover:bg-white/30"
                              >
                                {isMuted.processed ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                              </Button>
                            </div>
                            <div className="text-xs text-white">
                              {formatTime(currentTime.processed || 0)} / {formatTime(duration.processed || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Tabbed view */
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-900/50">
                  <TabsTrigger value="original" className="data-[state=active]:bg-blue-600">
                    Original
                  </TabsTrigger>
                  <TabsTrigger value="processed" className="data-[state=active]:bg-green-600" disabled={!hasProcessedContent}>
                    Processed
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="original" className="p-6">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    {editingType === 'lipsync' && originalMediaUrl ? (
                      <img
                        src={originalMediaUrl}
                        alt="Original image"
                        className="w-full h-full object-contain"
                        onError={() => setMediaError('Failed to load original image')}
                      />
                    ) : isVideo && originalMediaUrl ? (
                      <video
                        ref={originalVideoRef}
                        src={originalMediaUrl}
                        className="w-full h-full object-contain"
                        controls
                        onTimeUpdate={(e) => handleTimeUpdate(e, 'original')}
                        onLoadedMetadata={(e) => handleLoadedMetadata(e, 'original')}
                        onPlay={() => setIsPlaying(prev => ({ ...prev, original: true }))}
                        onPause={() => setIsPlaying(prev => ({ ...prev, original: false }))}
                        onError={(e) => handleMediaError(e, 'original')}
                      />
                    ) : originalMediaUrl ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <audio
                          ref={originalAudioRef}
                          src={originalMediaUrl}
                          className="w-full max-w-md"
                          controls
                          onTimeUpdate={(e) => handleTimeUpdate(e, 'original')}
                          onLoadedMetadata={(e) => handleLoadedMetadata(e, 'original')}
                          onPlay={() => setIsPlaying(prev => ({ ...prev, original: true }))}
                          onPause={() => setIsPlaying(prev => ({ ...prev, original: false }))}
                          onError={(e) => handleMediaError(e, 'original')}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <p className="text-gray-400">No original content</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="processed" className="p-6">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    {hasProcessedContent ? (
                      isVideo ? (
                        <video
                          ref={processedVideoRef}
                          src={processedMediaUrl || ''}
                          className="w-full h-full object-contain"
                          controls
                          onTimeUpdate={(e) => handleTimeUpdate(e, 'processed')}
                          onLoadedMetadata={(e) => handleLoadedMetadata(e, 'processed')}
                          onPlay={() => setIsPlaying(prev => ({ ...prev, processed: true }))}
                          onPause={() => setIsPlaying(prev => ({ ...prev, processed: false }))}
                          onError={(e) => handleMediaError(e, 'processed')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                          <audio
                            ref={processedAudioRef}
                            src={processedMediaUrl || ''}
                            className="w-full max-w-md"
                            controls
                            onTimeUpdate={(e) => handleTimeUpdate(e, 'processed')}
                            onLoadedMetadata={(e) => handleLoadedMetadata(e, 'processed')}
                            onPlay={() => setIsPlaying(prev => ({ ...prev, processed: true }))}
                            onPause={() => setIsPlaying(prev => ({ ...prev, processed: false }))}
                            onError={(e) => handleMediaError(e, 'processed')}
                          />
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <div className="text-center">
                          <RotateCcw className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                          <p className="text-gray-400">Processing in progress...</p>
                          <p className="text-sm text-gray-500 mt-2">Complete the editing step to see results</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Project Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-black/20 backdrop-blur-md border-white/10">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-white">Project Details</h3>
                <div className="space-y-1 text-sm text-gray-300">
                  <p>Name: {currentProject.name}</p>
                  <p>Type: {editingType === 'voice' ? 'Voice Transformation' : 'Lipsync Generation'}</p>
                  <p>Status: {hasProcessedContent ? 'Completed' : 'Processing'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-white">Content Information</h3>
                <div className="space-y-1 text-sm text-gray-300">
                  {editingType === 'lipsync' ? (
                    <>
                      <p>Image: {uploadedFiles.image ? uploadedFiles.image.name : 'None'}</p>
                      <p>Audio: {uploadedFiles.audio ? uploadedFiles.audio.name : 'None'}</p>
                      <p>Output: Talking Video</p>
                    </>
                  ) : (
                    <>
                      <p>Input: {uploadedFiles.video ? 'Video' : uploadedFiles.audio ? 'Audio' : 'None'}</p>
                      <p>Transformation: Voice Effects Applied</p>
                      <p>Output: {uploadedFiles.video ? 'Modified Video' : 'Modified Audio'}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-white">Quality & Format</h3>
                <div className="space-y-1 text-sm text-gray-300">
                  <p>Processing: Browser-based</p>
                  <p>Quality: High (1080p)</p>
                  <p>Format: {editingType === 'lipsync' ? 'MP4' : (uploadedFiles.video ? 'MP4' : 'WAV')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-blue-900/20 border-blue-500/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-300 mb-3">📺 Preview Tips</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• <strong>Comparison mode:</strong> Use side-by-side view to evaluate quality differences</li>
              <li>• <strong>Audio sync:</strong> Check that voice and lip movements are properly synchronized</li>
              <li>• <strong>Quality check:</strong> Preview at full volume to assess audio clarity</li>
              <li>• <strong>Playback controls:</strong> Use seek and volume controls for detailed review</li>
              <li>• <strong>Download ready:</strong> Once satisfied, proceed to export for final download</li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
