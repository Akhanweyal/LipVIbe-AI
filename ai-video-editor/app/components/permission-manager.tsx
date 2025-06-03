
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, AlertCircle, CheckCircle, X, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface PermissionStatus {
  microphone: 'granted' | 'denied' | 'prompt' | 'unknown';
  audio: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export function PermissionManager() {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    microphone: 'unknown',
    audio: 'granted' // Audio playback is usually allowed by default
  });
  const [showPermissionCard, setShowPermissionCard] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      // Check microphone permission
      if (navigator.permissions) {
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissions(prev => ({ ...prev, microphone: micPermission.state }));
        
        // Show permission card if microphone is not granted
        if (micPermission.state !== 'granted') {
          setShowPermissionCard(true);
        }
      } else {
        // Fallback for browsers without permissions API
        setPermissions(prev => ({ ...prev, microphone: 'prompt' }));
        setShowPermissionCard(true);
      }
    } catch (error) {
      console.warn('Permission check failed:', error);
      setPermissions(prev => ({ ...prev, microphone: 'prompt' }));
      setShowPermissionCard(true);
    }
  };

  const requestMicrophonePermission = async () => {
    setIsChecking(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Permission granted, stop the stream
      stream.getTracks().forEach(track => track.stop());
      
      setPermissions(prev => ({ ...prev, microphone: 'granted' }));
      setShowPermissionCard(false);
      
      toast({
        title: "Microphone Access Granted",
        description: "You can now use recording features and voice previews.",
      });
    } catch (error: any) {
      console.error('Microphone permission error:', error);
      
      let errorMessage = "Failed to access microphone. ";
      if (error.name === 'NotAllowedError') {
        setPermissions(prev => ({ ...prev, microphone: 'denied' }));
        errorMessage += "Please allow microphone access in your browser settings.";
      } else if (error.name === 'NotFoundError') {
        errorMessage += "No microphone found. Please connect a microphone.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage += "Your browser doesn't support microphone access.";
      } else {
        errorMessage += "Please check your browser settings.";
      }
      
      toast({
        title: "Microphone Access Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const testAudioPlayback = async () => {
    try {
      // Create a simple audio context to test audio playback
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Create a short beep to test audio
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      setPermissions(prev => ({ ...prev, audio: 'granted' }));
      
      toast({
        title: "Audio Test Successful",
        description: "Audio playback is working correctly.",
      });
      
      audioContext.close();
    } catch (error) {
      console.error('Audio test failed:', error);
      setPermissions(prev => ({ ...prev, audio: 'denied' }));
      
      toast({
        title: "Audio Test Failed",
        description: "Please check your browser audio settings and try again.",
        variant: "destructive",
      });
    }
  };

  const openBrowserSettings = () => {
    toast({
      title: "Browser Settings",
      description: "Look for the microphone icon in your browser's address bar, or check Settings > Privacy & Security > Site Settings.",
    });
  };

  const getPermissionIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'denied':
        return <X className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getPermissionBadge = (status: string) => {
    switch (status) {
      case 'granted':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Granted</Badge>;
      case 'denied':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Denied</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Required</Badge>;
    }
  };

  return (
    <>
      {/* Permission Status Indicator */}
      <div className="fixed top-20 right-4 z-40">
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col space-y-2"
        >
          {/* Microphone Status */}
          <Card className="bg-black/80 backdrop-blur-md border-white/10 p-2">
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-gray-400" />
              {getPermissionIcon(permissions.microphone)}
              <span className="text-xs text-gray-300">Mic</span>
            </div>
          </Card>
          
          {/* Audio Status */}
          <Card className="bg-black/80 backdrop-blur-md border-white/10 p-2">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-gray-400" />
              {getPermissionIcon(permissions.audio)}
              <span className="text-xs text-gray-300">Audio</span>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Permission Request Card */}
      <AnimatePresence>
        {showPermissionCard && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50 max-w-md"
          >
            <Card className="bg-black/90 backdrop-blur-md border-purple-500/30 shadow-lg shadow-purple-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Mic className="w-5 h-5 text-purple-400" />
                    <span>Browser Permissions</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPermissionCard(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription className="text-gray-300">
                  Grant permissions for the best experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Microphone Permission */}
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mic className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="font-medium text-white">Microphone</p>
                      <p className="text-sm text-gray-400">For recording and voice previews</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPermissionBadge(permissions.microphone)}
                    {permissions.microphone !== 'granted' && (
                      <Button
                        size="sm"
                        onClick={requestMicrophonePermission}
                        disabled={isChecking}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isChecking ? 'Checking...' : 'Allow'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Audio Playback */}
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="font-medium text-white">Audio Playback</p>
                      <p className="text-sm text-gray-400">For playing uploaded files</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPermissionBadge(permissions.audio)}
                    <Button
                      size="sm"
                      onClick={testAudioPlayback}
                      variant="outline"
                      className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
                    >
                      Test
                    </Button>
                  </div>
                </div>

                {/* Help Text */}
                <div className="text-sm text-gray-400 space-y-2">
                  <p>💡 <strong>Why these permissions?</strong></p>
                  <ul className="space-y-1 ml-4">
                    <li>• <strong>Microphone:</strong> Record audio for voice transformation</li>
                    <li>• <strong>Audio:</strong> Play uploaded files and preview results</li>
                    <li>• <strong>Privacy:</strong> All processing happens locally in your browser</li>
                  </ul>
                </div>

                {/* Browser Settings Link */}
                {permissions.microphone === 'denied' && (
                  <div className="pt-2 border-t border-gray-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={openBrowserSettings}
                      className="w-full text-gray-400 hover:text-white"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Open Browser Settings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
