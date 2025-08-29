// Upload API route for document processing
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import * as mammoth from 'mammoth';
import { chunkText, chunkByPages } from '@/lib/chunker';
import { discoveryService } from '@/lib/ibmDiscovery';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

// Process PDF file
async function processPDF(buffer: Buffer, filename: string) {
  try {
    // Dynamic import to avoid build-time issues
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(buffer);
    
    // If we can extract page-wise content, use it
    if (data.numpages > 1) {
      // For now, we'll chunk the entire text as PDF-parse doesn't provide page-wise text
      const chunks = chunkText(data.text, filename, {
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      return chunks;
    } else {
      const chunks = chunkText(data.text, filename);
      return chunks;
    }
  } catch (error) {
    throw new Error(`Failed to process PDF: ${error}`);
  }
}

// Process Word document
async function processWord(buffer: Buffer, filename: string) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const chunks = chunkText(result.value, filename);
    return chunks;
  } catch (error) {
    throw new Error(`Failed to process Word document: ${error}`);
  }
}

// Process plain text file
async function processText(buffer: Buffer, filename: string) {
  try {
    const text = buffer.toString('utf-8');
    const chunks = chunkText(text, filename);
    return chunks;
  } catch (error) {
    throw new Error(`Failed to process text file: ${error}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, Word, or text files.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file to uploads directory
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = join(UPLOAD_DIR, `${Date.now()}_${safeFilename}`);
    await writeFile(filePath, buffer);

    // Process file based on type
    let chunks;
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    switch (file.type) {
      case 'application/pdf':
        chunks = await processPDF(buffer, file.name);
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        chunks = await processWord(buffer, file.name);
        break;
      case 'text/plain':
        chunks = await processText(buffer, file.name);
        break;
      default:
        // Try to process as text if other methods fail
        chunks = await processText(buffer, file.name);
        break;
    }

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No readable content found in the file.' },
        { status: 400 }
      );
    }

    // Upload chunks to IBM Discovery
    try {
      const documentIds = await discoveryService.addDocuments(chunks);
      
      return NextResponse.json({
        success: true,
        message: `Successfully processed ${file.name}`,
        details: {
          filename: file.name,
          fileSize: file.size,
          chunksCreated: chunks.length,
          documentsUploaded: documentIds.length,
          processingTime: Date.now(),
        },
      });
    } catch (discoveryError) {
      console.error('Discovery upload error:', discoveryError);
      
      // Return partial success - file was processed but not uploaded to Discovery
      return NextResponse.json({
        success: false,
        error: 'File was processed but failed to upload to IBM Discovery',
        details: {
          filename: file.name,
          chunksCreated: chunks.length,
          discoveryError: String(discoveryError),
        },
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Upload processing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process file',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Upload endpoint is working',
    supportedTypes: ['PDF', 'Word Document', 'Text File'],
    maxSize: '10MB',
  });
}
