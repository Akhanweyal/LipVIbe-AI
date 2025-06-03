
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  originalVideoPath?: string;
  originalAudioPath?: string;
  processedVideoPath?: string;
  processedAudioPath?: string;
  finalVideoPath?: string;
  voiceChangeType?: string;
  voiceChangeSettings?: any;
  lipsyncSettings?: any;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  processingProgress: number;
  exportFormat: string;
  exportQuality: string;
}

export interface ProcessingJob {
  id: string;
  projectId: string;
  type: 'voice-change' | 'lipsync' | 'export';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceChangeOptions {
  type: 'male-to-kid' | 'female-to-male' | 'male-to-female' | 'kid-to-adult' | 'custom';
  pitch?: number;
  speed?: number;
  tone?: string;
}

export interface LipsyncOptions {
  quality: 'fast' | 'standard' | 'high';
  faceEnhancement: boolean;
  multiSpeaker: boolean;
}

export interface ExportOptions {
  format: 'mp4' | 'mov' | 'webm';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: '720p' | '1080p' | '4k';
  aspectRatio: '9:16' | '16:9' | '1:1';
}
