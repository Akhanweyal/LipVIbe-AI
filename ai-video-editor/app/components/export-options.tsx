
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Settings, Smartphone, Monitor, Square, RotateCcw, CheckCircle, FileVideo, Music, Image } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ExportOptionsProps {
  currentProject: any;
  onProcessingUpdate: (status: any) => void;
  uploadedFiles: {
    image?: File;
    video?: File;
    audio?: File;
  };
  editingType: 'lipsync' | 'voice' | null;
}

const formatOptions = [
  { value: 'mp4', label: 'MP4', description: 'Best compatibility, recommended for most platforms', icon: FileVideo },
  { value: 'mov', label: 'MOV', description: 'High quality, preferred for professional editing', icon: FileVideo },
  { value: 'webm', label: 'WebM', description: 'Web optimized, smaller file sizes', icon: FileVideo },
  { value: 'wav', label: 'WAV', description: 'Uncompressed audio, highest quality', icon: Music },
  { value: 'mp3', label: 'MP3', description: 'Compressed audio, smaller file size', icon: Music },
];

const qualityOptions = [
  { value: 'low', label: 'Low (720p)', description: 'Smaller file size, faster upload', size: '~5-10 MB', bitrate: '1 Mbps' },
  { value: 'medium', label: 'Medium (1080p)', description: 'Balanced quality and size', size: '~15-25 MB', bitrate: '3 Mbps' },
  { value: 'high', label: 'High (1080p+)', description: 'Best quality, larger file', size: '~30-50 MB', bitrate: '5 Mbps' },
  { value: 'ultra', label: 'Ultra (4K)', description: 'Maximum quality, very large file', size: '~100+ MB', bitrate: '10 Mbps' },
];

const aspectRatios = [
  { value: '9:16', label: 'Vertical (9:16)', description: 'Perfect for TikTok, Instagram Stories, YouTube Shorts', icon: Smartphone },
  { value: '16:9', label: 'Horizontal (16:9)', description: 'Standard for YouTube, Facebook videos', icon: Monitor },
  { value: '1:1', label: 'Square (1:1)', description: 'Instagram posts, Facebook square videos', icon: Square },
];

export function ExportOptions({ currentProject, onProcessingUpdate, uploadedFiles, editingType }: ExportOptionsProps) {
  const [exportSettings, setExportSettings] = useState({
    format: editingType === 'lipsync' ? 'mp4' : (uploadedFiles.video ? 'mp4' : 'wav'),
    quality: 'high',
    aspectRatio: '9:16',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const { toast } = useToast();

  // Filter format options based on editing type
  const availableFormats = formatOptions.filter(format => {
    if (editingType === 'lipsync') {
      return ['mp4', 'mov', 'webm'].includes(format.value);
    } else if (editingType === 'voice') {
      if (uploadedFiles.video) {
        return ['mp4', 'mov', 'webm'].includes(format.value);
      } else {
        return ['wav', 'mp3'].includes(format.value);
      }
    }
    return true;
  });

  // Filter quality options based on format
  const availableQualities = exportSettings.format === 'wav' || exportSettings.format === 'mp3' 
    ? [
        { value: 'low', label: 'Standard (44.1kHz)', description: 'CD quality audio', size: '~3-5 MB', bitrate: '128 kbps' },
        { value: 'medium', label: 'High (48kHz)', description: 'Professional audio quality', size: '~5-8 MB', bitrate: '192 kbps' },
        { value: 'high', label: 'Studio (96kHz)', description: 'Studio quality audio', size: '~8-12 MB', bitrate: '320 kbps' },
      ]
    : qualityOptions;

  const handleExport = async () => {
    if (!currentProject) {
      toast({
        title: "No Project Selected",
        description: "Please select a project to export.",
        variant: "destructive",
      });
      return;
    }

    if (!currentProject.processedVideoPath && !currentProject.processedAudioPath) {
      toast({
        title: "No Processed Content",
        description: "Please complete the editing process before exporting.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    setExportComplete(false);
    setExportProgress(0);
    onProcessingUpdate({
      isProcessing: true,
      progress: 0,
      stage: 'Preparing export...'
    });

    try {
      // Simulate export stages with realistic processing
      const stages = [
        { name: 'Initializing export process...', duration: 1000 },
        { name: 'Loading processed content...', duration: 1500 },
        { name: `Converting to ${exportSettings.format.toUpperCase()} format...`, duration: 3000 },
        { name: `Applying ${exportSettings.quality} quality settings...`, duration: 2500 },
        { name: editingType === 'lipsync' ? 'Adjusting aspect ratio...' : 'Optimizing audio quality...', duration: 2000 },
        { name: 'Finalizing export...', duration: 1500 },
        { name: 'Export completed!', duration: 500 }
      ];

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const progress = Math.round(((i + 1) / stages.length) * 100);
        
        onProcessingUpdate({
          isProcessing: true,
          progress,
          stage: stage.name
        });
        
        setExportProgress(progress);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, stage.duration));
      }

      // Create a mock download URL (in real implementation, this would be the actual exported file)
      const timestamp = Date.now();
      const filename = `${currentProject.name}-${editingType}-${timestamp}.${exportSettings.format}`;
      
      // For demo purposes, create a blob URL
      const mockContent = editingType === 'lipsync' ? 'mock video content' : 'mock audio content';
      const blob = new Blob([mockContent], { 
        type: exportSettings.format === 'mp4' ? 'video/mp4' : 
              exportSettings.format === 'wav' ? 'audio/wav' : 
              exportSettings.format === 'mp3' ? 'audio/mp3' : 'video/mp4'
      });
      const downloadUrl = URL.createObjectURL(blob);
      
      setDownloadUrl(downloadUrl);
      setExportComplete(true);

      // Call the export API (mock implementation)
      try {
        const response = await fetch('/api/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: currentProject.id,
            settings: exportSettings
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Export API response:', result);
        }
      } catch (apiError) {
        console.warn('Export API call failed, using mock download:', apiError);
      }

      onProcessingUpdate({
        isProcessing: false,
        progress: 100,
        stage: 'Export completed successfully!'
      });

      toast({
        title: "Export Complete",
        description: `Your ${editingType} has been successfully exported and is ready for download.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      onProcessingUpdate({
        isProcessing: false,
        progress: 0,
        stage: ''
      });
      
      toast({
        title: "Export Failed",
        description: "There was an error exporting your content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${currentProject.name}-${editingType}-${Date.now()}.${exportSettings.format}`;
      link.click();
      
      toast({
        title: "Download Started",
        description: "Your file download has started.",
      });
    }
  };

  const getEstimatedFileSize = () => {
    const quality = availableQualities.find(q => q.value === exportSettings.quality);
    return quality?.size || '~20-30 MB';
  };

  const getEstimatedTime = () => {
    const baseTime = exportSettings.quality === 'ultra' ? 60 : 
                    exportSettings.quality === 'high' ? 30 : 
                    exportSettings.quality === 'medium' ? 20 : 10;
    return `~${baseTime} seconds`;
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
              <Download className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Project Selected</h3>
            <p className="text-gray-300 text-sm">
              Please create a project and process your content to access export options.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const hasProcessedContent = currentProject?.processedVideoPath || currentProject?.processedAudioPath;

  return (
    <div className="space-y-6">
      {/* Export Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-black/20 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Download className="w-5 h-5" />
              <span>Export & Download</span>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                Step 5: Export
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Choose your export settings and download your {editingType === 'voice' ? 'voice-transformed' : 'lipsync'} content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasProcessedContent && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3">
                  <RotateCcw className="w-5 h-5 text-yellow-400 animate-spin" />
                  <div>
                    <p className="font-medium text-yellow-300">Processing Required</p>
                    <p className="text-sm text-yellow-200">Complete the editing step before exporting your content.</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Format Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-black/20 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Settings className="w-5 h-5" />
              <span>Export Format</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Choose the format that best suits your needs and target platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableFormats.map((format) => {
                const IconComponent = format.icon;
                return (
                  <motion.div
                    key={format.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-200 ${
                        exportSettings.format === format.value
                          ? 'bg-purple-900/40 border-purple-400 shadow-lg shadow-purple-500/20'
                          : 'bg-gray-900/40 border-gray-600 hover:border-purple-400/50'
                      }`}
                      onClick={() => setExportSettings(prev => ({ ...prev, format: format.value }))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            exportSettings.format === format.value ? 'bg-purple-500' : 'bg-gray-600'
                          }`}>
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="font-semibold text-white">{format.label}</h3>
                        </div>
                        <p className="text-sm text-gray-300">{format.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quality Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-black/20 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Monitor className="w-5 h-5" />
              <span>{exportSettings.format === 'wav' || exportSettings.format === 'mp3' ? 'Audio Quality' : 'Video Quality'}</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Select the quality level for your exported {exportSettings.format === 'wav' || exportSettings.format === 'mp3' ? 'audio' : 'video'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {availableQualities.map((quality) => (
                <motion.div
                  key={quality.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 ${
                      exportSettings.quality === quality.value
                        ? 'bg-purple-900/40 border-purple-400 shadow-lg shadow-purple-500/20'
                        : 'bg-gray-900/40 border-gray-600 hover:border-purple-400/50'
                    }`}
                    onClick={() => setExportSettings(prev => ({ ...prev, quality: quality.value }))}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-white mb-1">{quality.label}</h3>
                      <p className="text-xs text-gray-400 mb-2">{quality.size}</p>
                      <p className="text-sm text-gray-300 mb-2">{quality.description}</p>
                      <p className="text-xs text-blue-300">{quality.bitrate}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Aspect Ratio Selection (only for video formats) */}
      {(exportSettings.format === 'mp4' || exportSettings.format === 'mov' || exportSettings.format === 'webm') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-black/20 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Square className="w-5 h-5" />
                <span>Aspect Ratio</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Choose the aspect ratio optimized for your target platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aspectRatios.map((ratio) => {
                  const IconComponent = ratio.icon;
                  return (
                    <motion.div
                      key={ratio.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all duration-200 ${
                          exportSettings.aspectRatio === ratio.value
                            ? 'bg-purple-900/40 border-purple-400 shadow-lg shadow-purple-500/20'
                            : 'bg-gray-900/40 border-gray-600 hover:border-purple-400/50'
                        }`}
                        onClick={() => setExportSettings(prev => ({ ...prev, aspectRatio: ratio.value }))}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              exportSettings.aspectRatio === ratio.value ? 'bg-purple-500' : 'bg-gray-600'
                            }`}>
                              <IconComponent className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="font-semibold text-white">{ratio.label}</h3>
                          </div>
                          <p className="text-sm text-gray-300">{ratio.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Export Summary & Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-black/20 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Export Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="space-y-2">
                <Label className="text-gray-300">Format</Label>
                <p className="text-white font-medium">{exportSettings.format.toUpperCase()}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Quality</Label>
                <p className="text-white font-medium">
                  {availableQualities.find(q => q.value === exportSettings.quality)?.label}
                </p>
              </div>
              {(exportSettings.format === 'mp4' || exportSettings.format === 'mov' || exportSettings.format === 'webm') && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Aspect Ratio</Label>
                  <p className="text-white font-medium">{exportSettings.aspectRatio}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-gray-300">Estimated Size</Label>
                <p className="text-white font-medium">{getEstimatedFileSize()}</p>
              </div>
            </div>

            {/* Export Progress */}
            {isExporting && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Exporting...</span>
                  <span className="text-gray-300">{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} className="w-full" />
                <p className="text-sm text-gray-400 mt-2">Estimated time: {getEstimatedTime()}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleExport}
                disabled={isExporting || !hasProcessedContent}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export {editingType === 'voice' ? 'Audio' : 'Video'}
                  </>
                )}
              </Button>

              {exportComplete && downloadUrl && (
                <Button
                  onClick={handleDownload}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Platform Optimization Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-blue-900/20 border-blue-500/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-300 mb-3">📱 Platform Optimization Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
              <div>
                <h4 className="font-medium text-blue-200 mb-2">TikTok & Instagram Reels</h4>
                <ul className="space-y-1">
                  <li>• 9:16 aspect ratio</li>
                  <li>• MP4 format</li>
                  <li>• High quality (1080p)</li>
                  <li>• Max 60 seconds</li>
                  <li>• File size under 100MB</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-200 mb-2">YouTube Shorts</h4>
                <ul className="space-y-1">
                  <li>• 9:16 aspect ratio</li>
                  <li>• MP4 format</li>
                  <li>• High/Ultra quality</li>
                  <li>• Max 60 seconds</li>
                  <li>• Good audio quality essential</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-200 mb-2">General Social Media</h4>
                <ul className="space-y-1">
                  <li>• 1:1 for Instagram posts</li>
                  <li>• 16:9 for Facebook/YouTube</li>
                  <li>• Medium quality for faster upload</li>
                  <li>• Consider platform file limits</li>
                  <li>• Test on mobile devices</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
