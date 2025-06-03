
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const type = formData.get('type') as string; // 'video' or 'audio'

    console.log('Upload request:', { 
      fileName: file?.name, 
      fileType: file?.type, 
      fileSize: file?.size, 
      projectId, 
      type 
    });

    if (!file || !projectId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file type - be more lenient for testing
    const isVideo = file.type.startsWith('video/') || file.name.toLowerCase().match(/\.(mp4|mov|avi|webm|mkv)$/);
    const isAudio = file.type.startsWith('audio/') || file.name.toLowerCase().match(/\.(mp3|wav|aac|ogg|m4a)$/);
    
    if (!isVideo && !isAudio) {
      console.log('File type validation failed:', { fileType: file.type, fileName: file.name });
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a video or audio file.' },
        { status: 400 }
      );
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', projectId);
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${type}_${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update project with file path
    const updateData: any = {};
    if (type === 'video') {
      updateData.originalVideoPath = filepath;
    } else if (type === 'audio') {
      updateData.originalAudioPath = filepath;
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      filename,
      filepath,
      project
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
