
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Video, Mic, Sparkles, Download, Play, Pause, RotateCcw, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { VideoUpload } from '@/components/video-upload';
import { VoiceChanger } from '@/components/voice-changer';
import { LipsyncGenerator } from '@/components/lipsync-generator';
import { VideoPreview } from '@/components/video-preview';
import { ExportOptions } from '@/components/export-options';
import { ProjectManager } from '@/components/project-manager';
import { PermissionManager } from '@/components/permission-manager';
import { useToast } from '@/hooks/use-toast';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: 'pending' | 'active' | 'completed' | 'error';
  required: boolean;
}

export default function HomePage() {
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<{
    image?: File;
    video?: File;
    audio?: File;
  }>({});
  const [editingType, setEditingType] = useState<'lipsync' | 'voice' | null>(null);
  const [processingStatus, setProcessingStatus] = useState<{
    isProcessing: boolean;
    progress: number;
    stage: string;
  }>({
    isProcessing: false,
    progress: 0,
    stage: ''
  });
  const { toast } = useToast();

  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    {
      id: 'upload',
      title: 'Upload Content',
      description: 'Upload your base content (image for lipsync OR video/audio for voice change)',
      icon: Upload,
      status: 'active',
      required: true
    },
    {
      id: 'choose-type',
      title: 'Choose Editing Type',
      description: 'Select whether you want lipsync generation or voice transformation',
      icon: Sparkles,
      status: 'pending',
      required: true
    },
    {
      id: 'edit',
      title: 'Edit & Process',
      description: 'Apply your chosen editing type with real-time preview',
      icon: Video,
      status: 'pending',
      required: true
    },
    {
      id: 'preview',
      title: 'Preview Results',
      description: 'Review your edited content before export',
      icon: Play,
      status: 'pending',
      required: true
    },
    {
      id: 'export',
      title: 'Export & Download',
      description: 'Export your final video in your preferred format',
      icon: Download,
      status: 'pending',
      required: true
    }
  ]);

  const updateStepStatus = (stepId: string, status: WorkflowStep['status']) => {
    setWorkflowSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const handleProjectCreate = (project: any) => {
    setCurrentProject(project);
    setCurrentStep(0);
    setUploadedFiles({});
    setEditingType(null);
    // Reset all steps to pending except first
    setWorkflowSteps(prev => prev.map((step, index) => ({
      ...step,
      status: index === 0 ? 'active' : 'pending'
    })));
    toast({
      title: "Project Created",
      description: `Project "${project.name}" has been created successfully.`,
    });
  };

  const handleProjectLoad = (project: any) => {
    setCurrentProject(project);
    // Determine current step based on project state
    if (project.finalVideoPath) {
      setCurrentStep(4);
    } else if (project.processedVideoPath || project.processedAudioPath) {
      setCurrentStep(3);
    } else if (project.originalVideoPath) {
      setCurrentStep(1);
    } else {
      setCurrentStep(0);
    }
    toast({
      title: "Project Loaded",
      description: `Project "${project.name}" has been loaded.`,
    });
  };

  const handleFileUpload = (file: File, type: 'video' | 'audio' | 'image') => {
    if (!currentProject) {
      toast({
        title: "No Project Selected",
        description: "Please create or select a project first.",
        variant: "destructive",
      });
      return;
    }
    
    setUploadedFiles(prev => ({ ...prev, [type]: file }));
    updateStepStatus('upload', 'completed');
    
    // Auto-advance to next step
    if (currentStep === 0) {
      setCurrentStep(1);
      updateStepStatus('choose-type', 'active');
    }
    
    toast({
      title: "File Uploaded",
      description: `${type} file uploaded successfully.`,
    });
  };

  const handleEditingTypeSelect = (type: 'lipsync' | 'voice') => {
    setEditingType(type);
    updateStepStatus('choose-type', 'completed');
    updateStepStatus('edit', 'active');
    setCurrentStep(2);
    
    toast({
      title: "Editing Type Selected",
      description: `${type === 'lipsync' ? 'Lipsync Generation' : 'Voice Transformation'} mode activated.`,
    });
  };

  const handleProcessingComplete = () => {
    updateStepStatus('edit', 'completed');
    updateStepStatus('preview', 'active');
    setCurrentStep(3);
    
    toast({
      title: "Processing Complete",
      description: "Your content has been processed successfully. Review the preview.",
    });
  };

  const handlePreviewApproved = () => {
    updateStepStatus('preview', 'completed');
    updateStepStatus('export', 'active');
    setCurrentStep(4);
  };

  const handleProcessingUpdate = (status: any) => {
    setProcessingStatus(status);
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
      // Update step statuses
      setWorkflowSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index < stepIndex ? 'completed' : 
                index === stepIndex ? 'active' : 'pending'
      })));
    }
  };

  const canProceedToStep = (stepIndex: number) => {
    switch (stepIndex) {
      case 1: // Choose type
        return Object.keys(uploadedFiles).length > 0;
      case 2: // Edit
        return editingType !== null;
      case 3: // Preview
        return currentProject?.processedVideoPath || currentProject?.processedAudioPath;
      case 4: // Export
        return currentProject?.processedVideoPath || currentProject?.processedAudioPath;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Permission Manager */}
      <PermissionManager />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 backdrop-blur-md bg-black/20 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Video Editor
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <ProjectManager 
                onProjectCreate={handleProjectCreate}
                onProjectLoad={handleProjectLoad}
                currentProject={currentProject}
              />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="py-12 px-4 text-center"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Free AI Video Editor
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Professional voice changing and lipsync generation using free browser-based processing - no API costs, complete privacy
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              100% Free
            </Badge>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              Browser-Based
            </Badge>
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
              Privacy First
            </Badge>
          </div>
          
          {processingStatus.isProcessing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <Card className="max-w-md mx-auto bg-purple-900/20 border-purple-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center animate-spin">
                      <RotateCcw className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Processing...</p>
                      <p className="text-sm text-gray-300">{processingStatus.stage}</p>
                    </div>
                  </div>
                  <Progress value={processingStatus.progress} className="w-full" />
                  <p className="text-sm text-gray-400 mt-2">{processingStatus.progress}% complete</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Workflow Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Step Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-black/20 backdrop-blur-md border-white/10">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
                {workflowSteps.map((step, index) => {
                  const IconComponent = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = step.status === 'completed';
                  const canAccess = index <= currentStep || canProceedToStep(index);
                  
                  return (
                    <div key={step.id} className="flex items-center space-x-4">
                      <motion.div
                        whileHover={canAccess ? { scale: 1.05 } : {}}
                        whileTap={canAccess ? { scale: 0.95 } : {}}
                        className={`flex flex-col items-center space-y-2 cursor-pointer ${
                          canAccess ? '' : 'opacity-50 cursor-not-allowed'
                        }`}
                        onClick={() => canAccess && goToStep(index)}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                          isCompleted ? 'bg-green-500 text-white' :
                          isActive ? 'bg-purple-500 text-white' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <IconComponent className="w-6 h-6" />
                          )}
                        </div>
                        <div className="text-center">
                          <p className={`text-sm font-medium ${
                            isActive ? 'text-purple-400' : 
                            isCompleted ? 'text-green-400' : 'text-gray-400'
                          }`}>
                            {step.title}
                          </p>
                          <p className="text-xs text-gray-500 max-w-24 hidden lg:block">
                            {step.description}
                          </p>
                        </div>
                      </motion.div>
                      
                      {index < workflowSteps.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-500 hidden lg:block" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 0 && (
            <VideoUpload 
              onFileUpload={handleFileUpload}
              currentProject={currentProject}
              uploadedFiles={uploadedFiles}
            />
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <Card className="bg-black/20 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Choose Your Editing Type</CardTitle>
                  <CardDescription className="text-gray-300">
                    Select the type of AI processing you want to apply to your content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all duration-200 ${
                          editingType === 'lipsync'
                            ? 'bg-purple-900/40 border-purple-400 shadow-lg shadow-purple-500/20'
                            : 'bg-gray-900/40 border-gray-600 hover:border-purple-400/50'
                        }`}
                        onClick={() => handleEditingTypeSelect('lipsync')}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                              <Video className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">Lipsync Generation</h3>
                              <p className="text-sm text-gray-400">Image + Audio → Talking Video</p>
                            </div>
                          </div>
                          <p className="text-gray-300 mb-4">
                            Upload an image and audio file to create a realistic talking video with synchronized lip movements.
                          </p>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-400">Requirements:</p>
                            <ul className="text-sm text-gray-500 space-y-1">
                              <li>• Portrait image (face clearly visible)</li>
                              <li>• Audio file with clear speech</li>
                              <li>• Browser-based processing</li>
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all duration-200 ${
                          editingType === 'voice'
                            ? 'bg-purple-900/40 border-purple-400 shadow-lg shadow-purple-500/20'
                            : 'bg-gray-900/40 border-gray-600 hover:border-purple-400/50'
                        }`}
                        onClick={() => handleEditingTypeSelect('voice')}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <Mic className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">Voice Transformation</h3>
                              <p className="text-sm text-gray-400">Audio/Video → Modified Voice</p>
                            </div>
                          </div>
                          <p className="text-gray-300 mb-4">
                            Transform voices in audio or video files with various effects like pitch shifting, gender change, and more.
                          </p>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-400">Features:</p>
                            <ul className="text-sm text-gray-500 space-y-1">
                              <li>• Multiple voice presets</li>
                              <li>• Real-time preview</li>
                              <li>• Professional audio effects</li>
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 2 && editingType === 'voice' && (
            <VoiceChanger 
              currentProject={currentProject}
              onProcessingUpdate={handleProcessingUpdate}
              onProcessingComplete={handleProcessingComplete}
              uploadedFiles={uploadedFiles}
            />
          )}

          {currentStep === 2 && editingType === 'lipsync' && (
            <LipsyncGenerator 
              currentProject={currentProject}
              onProcessingUpdate={handleProcessingUpdate}
              onProcessingComplete={handleProcessingComplete}
              uploadedFiles={uploadedFiles}
            />
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <VideoPreview 
                currentProject={currentProject}
                uploadedFiles={uploadedFiles}
                editingType={editingType}
              />
              <div className="flex justify-center">
                <Button
                  onClick={handlePreviewApproved}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!currentProject?.processedVideoPath && !currentProject?.processedAudioPath}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Continue to Export
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <ExportOptions 
              currentProject={currentProject}
              onProcessingUpdate={handleProcessingUpdate}
              uploadedFiles={uploadedFiles}
              editingType={editingType}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
