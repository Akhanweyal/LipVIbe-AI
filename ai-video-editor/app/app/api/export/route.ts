
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Mock export processing
async function processExport(projectId: string, settings: any) {
  console.log(`Processing export for project ${projectId}`);
  console.log(`Export settings:`, settings);

  // Simulate export processing time based on quality
  const processingTimes = {
    low: 2000,
    medium: 4000,
    high: 8000,
    ultra: 15000
  };
  
  const delay = processingTimes[settings.quality as keyof typeof processingTimes] || 4000;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Mock response - in real implementation, this would be the final exported video URL
  return {
    downloadUrl: `/api/download/${projectId}/final-video.${settings.format}`,
    fileSize: '25.4 MB',
    processingTime: delay / 1000,
    settings: settings
  };
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, settings } = await request.json();

    if (!projectId || !settings) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if project exists and has processed content
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!project.processedVideoPath && !project.processedAudioPath) {
      return NextResponse.json(
        { error: 'No processed content found. Please complete voice change and lipsync first.' },
        { status: 400 }
      );
    }

    // Create processing job
    const processingJob = await prisma.processingJob.create({
      data: {
        projectId,
        type: 'export',
        status: 'processing'
      }
    });

    try {
      // Process export (mock implementation)
      const result = await processExport(projectId, settings);

      // Update processing job with result
      await prisma.processingJob.update({
        where: { id: processingJob.id },
        data: {
          status: 'completed',
          progress: 100,
          result: result
        }
      });

      // Update project with final video path and completion status
      await prisma.project.update({
        where: { id: projectId },
        data: {
          finalVideoPath: result.downloadUrl,
          exportFormat: settings.format,
          exportQuality: settings.quality,
          status: 'completed',
          processingProgress: 100,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        downloadUrl: result.downloadUrl,
        fileSize: result.fileSize,
        processingJobId: processingJob.id
      });

    } catch (processingError) {
      // Update processing job with error
      await prisma.processingJob.update({
        where: { id: processingJob.id },
        data: {
          status: 'failed',
          error: processingError instanceof Error ? processingError.message : 'Unknown error'
        }
      });

      throw processingError;
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to process export' },
      { status: 500 }
    );
  }
}
