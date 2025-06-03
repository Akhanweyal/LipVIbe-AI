
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Play, Pause, Volume2, Settings, Sparkles, RotateCcw, Waves, Download, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface VoiceChangerProps {
  currentProject: any;
  onProcessingUpdate: (status: any) => void;
  onProcessingComplete: () => void;
  uploadedFiles: {
    image?: File;
    video?: File;
    audio?: File;
  };
}

const voiceTypes = [
  { value: 'male-to-female', label: 'Male to Female', description: 'Higher pitch, softer tone', pitch: 1.5, formant: 1.2, preview: '/audio/preview-male-to-female.mp3' },
  { value: 'female-to-male', label: 'Female to Male', description: 'Lower pitch, deeper tone', pitch: 0.7, formant: 0.8, preview: '/audio/preview-female-to-male.mp3' },
  { value: 'adult-to-child', label: 'Adult to Child', description: 'Higher pitch, faster speed', pitch: 1.8, formant: 1.4, preview: '/audio/preview-adult-to-child.mp3' },
  { value: 'child-to-adult', label: 'Child to Adult', description: 'Lower pitch, slower speed', pitch: 0.6, formant: 0.7, preview: '/audio/preview-child-to-adult.mp3' },
  { value: 'robot', label: 'Robot Voice', description: 'Robotic modulation effect', pitch: 1.0, formant: 1.0, preview: '/audio/preview-robot.mp3' },
  { value: 'elderly', label: 'Elderly Voice', description: 'Tremolo and slower speech', pitch: 0.9, formant: 0.9, preview: '/audio/preview-elderly.mp3' },
];

export function VoiceChanger({ currentProject, onProcessingUpdate, onProcessingComplete, uploadedFiles }: VoiceChangerProps) {
  const [selectedVoiceType, setSelectedVoiceType] = useState('');
  const [settings, setSettings] = useState({
    pitch: [1.0],
    speed: [1.0],
    reverb: [0],
    echo: [0],
    distortion: [0],
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedAudio, setProcessedAudio] = useState<string | null>(null);
  const [originalAudio, setOriginalAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<{
    original?: boolean;
    processed?: boolean;
    preview?: boolean;
  }>({});
  const [isMuted, setIsMuted] = useState<{
    original?: boolean;
    processed?: boolean;
    preview?: boolean;
  }>({});
  const [currentTime, setCurrentTime] = useState<{
    original?: number;
    processed?: number;
  }>({});
  const [duration, setDuration] = useState<{
    original?: number;
    processed?: number;
  }>({});
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceBuffer, setSourceBuffer] = useState<AudioBuffer | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioVisualization, setAudioVisualization] = useState<number[]>([]);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  
  const originalAudioRef = useRef<HTMLAudioElement>(null);
  const processedAudioRef = useRef<HTMLAudioElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize Web Audio API
    if (typeof window !== 'undefined') {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
    }
    
    // Load original audio from uploaded files
    if (uploadedFiles.audio) {
      const audioUrl = URL.createObjectURL(uploadedFiles.audio);
      setOriginalAudio(audioUrl);
    } else if (uploadedFiles.video) {
      const videoUrl = URL.createObjectURL(uploadedFiles.video);
      setOriginalAudio(videoUrl);
    }
    
    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [uploadedFiles]);

  // Load audio file for processing
  const loadAudioFile = async (file: File): Promise<AudioBuffer> => {
    if (!audioContext) throw new Error('Audio context not initialized');
    
    const arrayBuffer = await file.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  };

  // Apply voice transformation using Web Audio API
  const applyVoiceTransformation = async (buffer: AudioBuffer): Promise<AudioBuffer> => {
    if (!audioContext) throw new Error('Audio context not initialized');

    const selectedType = voiceTypes.find(type => type.value === selectedVoiceType);
    if (!selectedType) throw new Error('Voice type not found');

    // Create offline audio context for processing
    const offlineContext = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    // Create source
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;

    // Apply pitch shifting (simplified)
    const pitchShift = selectedType.pitch * settings.pitch[0];
    source.playbackRate.value = pitchShift;

    // Create effects chain
    let currentNode: AudioNode = source;

    // Add reverb effect
    if (settings.reverb[0] > 0) {
      const convolver = offlineContext.createConvolver();
      const impulseBuffer = createReverbImpulse(offlineContext, settings.reverb[0]);
      convolver.buffer = impulseBuffer;
      
      const wetGain = offlineContext.createGain();
      const dryGain = offlineContext.createGain();
      const outputGain = offlineContext.createGain();
      
      wetGain.gain.value = settings.reverb[0] * 0.3;
      dryGain.gain.value = 1 - (settings.reverb[0] * 0.3);
      
      currentNode.connect(dryGain);
      currentNode.connect(convolver);
      convolver.connect(wetGain);
      
      dryGain.connect(outputGain);
      wetGain.connect(outputGain);
      currentNode = outputGain;
    }

    // Add echo effect
    if (settings.echo[0] > 0) {
      const delay = offlineContext.createDelay(1.0);
      const feedback = offlineContext.createGain();
      const wetGain = offlineContext.createGain();
      const dryGain = offlineContext.createGain();
      const outputGain = offlineContext.createGain();
      
      delay.delayTime.value = 0.3;
      feedback.gain.value = settings.echo[0] * 0.4;
      wetGain.gain.value = settings.echo[0] * 0.5;
      dryGain.gain.value = 1 - (settings.echo[0] * 0.3);
      
      currentNode.connect(dryGain);
      currentNode.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wetGain);
      
      dryGain.connect(outputGain);
      wetGain.connect(outputGain);
      currentNode = outputGain;
    }

    // Add distortion for robot voice
    if (selectedVoiceType === 'robot' || settings.distortion[0] > 0) {
      const waveshaper = offlineContext.createWaveShaper();
      waveshaper.curve = createDistortionCurve(settings.distortion[0] || 0.5);
      waveshaper.oversample = '4x';
      
      currentNode.connect(waveshaper);
      currentNode = waveshaper;
    }

    // Connect to destination
    currentNode.connect(offlineContext.destination);

    // Start processing
    source.start(0);
    return await offlineContext.startRendering();
  };

  // Create reverb impulse response
  const createReverbImpulse = (context: OfflineAudioContext, intensity: number): AudioBuffer => {
    const length = context.sampleRate * 2; // 2 seconds
    const impulse = context.createBuffer(2, length, context.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - (i / length), 2);
        channelData[i] = (Math.random() * 2 - 1) * decay * intensity;
      }
    }
    
    return impulse;
  };

  // Create distortion curve
  const createDistortionCurve = (amount: number): Float32Array => {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    
    return curve;
  };

  // Convert AudioBuffer to downloadable blob
  const audioBufferToBlob = (buffer: AudioBuffer): Blob => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    
    // Create WAV file
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const handleVoiceChange = async () => {
    if (!selectedVoiceType) {
      toast({
        title: "No Voice Type Selected",
        description: "Please select a voice transformation type first.",
        variant: "destructive",
      });
      return;
    }

    if (!uploadedFiles.audio && !uploadedFiles.video) {
      toast({
        title: "No Audio File",
        description: "Please upload an audio or video file first.",
        variant: "destructive",
      });
      return;
    }

    if (!audioContext) {
      toast({
        title: "Audio Context Error",
        description: "Audio processing is not available. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    onProcessingUpdate({
      isProcessing: true,
      progress: 0,
      stage: 'Initializing browser-based voice transformation...'
    });

    try {
      onProcessingUpdate({
        isProcessing: true,
        progress: 20,
        stage: 'Loading audio file...'
      });

      // Load the actual uploaded audio file
      const audioFile = uploadedFiles.audio || uploadedFiles.video;
      if (!audioFile) throw new Error('No audio file available');

      const buffer = await loadAudioFile(audioFile);
      setSourceBuffer(buffer);

      onProcessingUpdate({
        isProcessing: true,
        progress: 40,
        stage: 'Analyzing audio characteristics...'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      onProcessingUpdate({
        isProcessing: true,
        progress: 60,
        stage: 'Applying voice transformation...'
      });

      // Apply actual voice transformation
      const processedBuffer = await applyVoiceTransformation(buffer);

      onProcessingUpdate({
        isProcessing: true,
        progress: 80,
        stage: 'Optimizing audio quality...'
      });

      // Convert processed buffer to blob and create URL
      const processedBlob = audioBufferToBlob(processedBuffer);
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedAudio(processedUrl);

      onProcessingUpdate({
        isProcessing: true,
        progress: 100,
        stage: 'Voice transformation completed!'
      });

      toast({
        title: "Voice Transformation Complete",
        description: "Your audio has been successfully transformed using browser-based processing.",
      });

      // Call completion callback
      onProcessingComplete();

    } catch (error) {
      console.error('Voice change error:', error);
      onProcessingUpdate({
        isProcessing: false,
        progress: 0,
        stage: ''
      });
      
      toast({
        title: "Transformation Failed",
        description: "There was an error processing your audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Record audio from microphone for testing
  const startRecording = async () => {
    try {
      // Request microphone permission
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        setOriginalAudio(audioUrl);
        
        if (audioContext) {
          try {
            const file = new File([blob], 'recorded-audio.wav', { type: 'audio/wav' });
            const buffer = await loadAudioFile(file);
            setSourceBuffer(buffer);
            toast({
              title: "Recording Complete",
              description: "Audio recorded successfully. You can now apply voice transformations.",
            });
          } catch (error) {
            console.error('Audio processing error:', error);
            toast({
              title: "Processing Error",
              description: "Failed to process recorded audio. Please try again.",
              variant: "destructive",
            });
          }
        }
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak into your microphone. Click stop when finished.",
      });
    } catch (error) {
      console.error('Recording error:', error);
      let errorMessage = "Could not access microphone. ";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += "Please allow microphone access in your browser settings.";
        } else if (error.name === 'NotFoundError') {
          errorMessage += "No microphone found. Please connect a microphone.";
        } else if (error.name === 'NotSupportedError') {
          errorMessage += "Your browser doesn't support audio recording.";
        } else {
          errorMessage += "Please check your browser permissions and try again.";
        }
      }
      
      toast({
        title: "Recording Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Media playback controls
  const togglePlayback = (type: 'original' | 'processed' | 'preview') => {
    const audioElement = type === 'original' ? originalAudioRef.current :
                        type === 'processed' ? processedAudioRef.current :
                        previewAudioRef.current;
    
    if (!audioElement) return;

    if (isPlaying[type]) {
      audioElement.pause();
    } else {
      // Pause other audio elements
      [originalAudioRef, processedAudioRef, previewAudioRef].forEach(ref => {
        if (ref.current && ref.current !== audioElement) {
          ref.current.pause();
        }
      });
      audioElement.play();
    }
    
    setIsPlaying(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const toggleMute = (type: 'original' | 'processed' | 'preview') => {
    const audioElement = type === 'original' ? originalAudioRef.current :
                        type === 'processed' ? processedAudioRef.current :
                        previewAudioRef.current;
    
    if (!audioElement) return;

    audioElement.muted = !audioElement.muted;
    setIsMuted(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Preview voice type
  const previewVoiceType = async (voiceType: string) => {
    setPreviewingVoice(voiceType);
    
    try {
      // Request audio permission for preview
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      // Create a simple audio context for preview
      if (audioContext) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        const voiceConfig = voiceTypes.find(v => v.value === voiceType);
        if (voiceConfig) {
          oscillator.frequency.setValueAtTime(440 * voiceConfig.pitch, audioContext.currentTime);
          oscillator.type = voiceType === 'robot' ? 'square' : 'sine';
        }
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        toast({
          title: "Voice Preview",
          description: `Previewing ${voiceConfig?.label} voice transformation.`,
        });
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Preview Unavailable",
        description: "Voice preview requires microphone permission. Please allow access to hear examples.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setPreviewingVoice(null), 1000);
    }
  };

  // Download processed audio
  const downloadProcessedAudio = () => {
    if (processedAudio) {
      const link = document.createElement('a');
      link.href = processedAudio;
      link.download = `voice-transformed-${selectedVoiceType}-${Date.now()}.wav`;
      link.click();
      
      toast({
        title: "Download Started",
        description: "Processed audio download has started.",
      });
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
              <Mic className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Project Selected</h3>
            <p className="text-gray-300 text-sm">
              Please create a project and upload audio/video files to start voice transformation.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Voice Type Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-black/20 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Mic className="w-5 h-5" />
              <span>Voice Transformation</span>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                Step 3: Edit
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Choose a voice transformation and preview the effect before applying
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voiceTypes.map((type) => (
                <motion.div
                  key={type.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedVoiceType === type.value
                        ? 'bg-purple-900/40 border-purple-400 shadow-lg shadow-purple-500/20'
                        : 'bg-gray-900/40 border-gray-600 hover:border-purple-400/50'
                    }`}
                    onClick={() => setSelectedVoiceType(type.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            selectedVoiceType === type.value ? 'bg-purple-500' : 'bg-gray-600'
                          }`}>
                            <Volume2 className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="font-semibold text-white">{type.label}</h3>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            previewVoiceType(type.value);
                          }}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-300">{type.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Audio Preview Section */}
      {(originalAudio || processedAudio) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-black/20 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Waves className="w-5 h-5" />
                <span>Audio Preview</span>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Before & After
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Compare the original and transformed audio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original Audio */}
                {originalAudio && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-white flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span>Original Audio</span>
                    </h3>
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <audio
                        ref={originalAudioRef}
                        src={originalAudio}
                        className="w-full mb-3"
                        onTimeUpdate={(e) => {
                          if (e.currentTarget && typeof e.currentTarget.currentTime === 'number') {
                            setCurrentTime(prev => ({ ...prev, original: e.currentTarget.currentTime }));
                          }
                        }}
                        onLoadedMetadata={(e) => {
                          if (e.currentTarget && typeof e.currentTarget.duration === 'number' && !isNaN(e.currentTarget.duration)) {
                            setDuration(prev => ({ ...prev, original: e.currentTarget.duration }));
                          }
                        }}
                        onPlay={() => setIsPlaying(prev => ({ ...prev, original: true }))}
                        onPause={() => setIsPlaying(prev => ({ ...prev, original: false }))}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => togglePlayback('original')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {isPlaying.original ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleMute('original')}
                            className="text-gray-400 hover:text-white"
                          >
                            {isMuted.original ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          </Button>
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTime(currentTime.original || 0)} / {formatTime(duration.original || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Processed Audio */}
                {processedAudio && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-white flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span>Transformed Audio</span>
                    </h3>
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <audio
                        ref={processedAudioRef}
                        src={processedAudio}
                        className="w-full mb-3"
                        onTimeUpdate={(e) => {
                          if (e.currentTarget && typeof e.currentTarget.currentTime === 'number') {
                            setCurrentTime(prev => ({ ...prev, processed: e.currentTarget.currentTime }));
                          }
                        }}
                        onLoadedMetadata={(e) => {
                          if (e.currentTarget && typeof e.currentTarget.duration === 'number' && !isNaN(e.currentTarget.duration)) {
                            setDuration(prev => ({ ...prev, processed: e.currentTarget.duration }));
                          }
                        }}
                        onPlay={() => setIsPlaying(prev => ({ ...prev, processed: true }))}
                        onPause={() => setIsPlaying(prev => ({ ...prev, processed: false }))}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => togglePlayback('processed')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isPlaying.processed ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleMute('processed')}
                            className="text-gray-400 hover:text-white"
                          >
                            {isMuted.processed ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          </Button>
                          <Button
                            size="sm"
                            onClick={downloadProcessedAudio}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTime(currentTime.processed || 0)} / {formatTime(duration.processed || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Advanced Settings */}
      {selectedVoiceType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-black/20 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Settings className="w-5 h-5" />
                <span>Audio Effects</span>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Real-time
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Fine-tune the voice transformation with professional audio effects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label className="text-white">Pitch Shift</Label>
                  <Slider
                    value={settings.pitch}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, pitch: value }))}
                    max={2.0}
                    min={0.5}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-400">
                    Current: {settings.pitch[0]}x
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-white">Playback Speed</Label>
                  <Slider
                    value={settings.speed}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, speed: value }))}
                    max={2.0}
                    min={0.5}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-400">
                    Current: {settings.speed[0]}x
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-white">Reverb</Label>
                  <Slider
                    value={settings.reverb}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, reverb: value }))}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-400">
                    Current: {Math.round(settings.reverb[0] * 100)}%
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-white">Echo</Label>
                  <Slider
                    value={settings.echo}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, echo: value }))}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-400">
                    Current: {Math.round(settings.echo[0] * 100)}%
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-white">Distortion</Label>
                  <Slider
                    value={settings.distortion}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, distortion: value }))}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-400">
                    Current: {Math.round(settings.distortion[0] * 100)}%
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-white">Audio Visualization</Label>
                  <canvas 
                    ref={canvasRef}
                    width="200" 
                    height="60"
                    className="w-full h-15 bg-gray-900/50 rounded border border-gray-600"
                  />
                  <p className="text-sm text-gray-400">
                    Real-time audio waveform
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recording Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-black/20 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Waves className="w-5 h-5" />
              <span>Audio Input</span>
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                Live Recording
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Record audio directly or use uploaded files for voice transformation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={`${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isRecording ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Record Audio
                  </>
                )}
              </Button>

              {(sourceBuffer || uploadedFiles.audio || uploadedFiles.video) && (
                <div className="flex items-center space-x-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Audio ready for processing</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Processing Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-black/20 backdrop-blur-md border-white/10">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleVoiceChange}
                  disabled={!selectedVoiceType || isProcessing || (!uploadedFiles.audio && !uploadedFiles.video)}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Transform Voice
                    </>
                  )}
                </Button>

                {processedAudio && (
                  <Button
                    onClick={downloadProcessedAudio}
                    variant="outline"
                    className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>

              {processedAudio && (
                <div className="flex items-center space-x-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Voice transformation ready</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-blue-900/20 border-blue-500/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-300 mb-3">🎤 Voice Transformation Tips</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• <strong>Preview voices:</strong> Click the play button on voice types to hear samples</li>
              <li>• <strong>Compare results:</strong> Use the before/after audio players to evaluate quality</li>
              <li>• <strong>Fine-tune effects:</strong> Adjust pitch, reverb, and echo for custom results</li>
              <li>• <strong>Recording quality:</strong> Use a quiet environment for best results</li>
              <li>• <strong>Browser processing:</strong> All transformations happen locally for privacy</li>
              <li>• <strong>Download options:</strong> Export processed audio as high-quality WAV files</li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
