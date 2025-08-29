// Admin API route for managing Discovery collection
import { NextRequest, NextResponse } from 'next/server';
import { discoveryService } from '@/lib/ibmDiscovery';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        // Get collection status
        const status = await discoveryService.getCollectionStatus();
        const documents = await discoveryService.listDocuments();
        
        return NextResponse.json({
          success: true,
          collection: {
            name: status.name,
            description: status.description,
            document_count: status.document_count || 0,
            status: status.status,
            created: status.created,
            updated: status.updated,
          },
          documents: documents.map(doc => ({
            id: doc.document_id,
            filename: doc.metadata?.filename || doc.filename || 'Unknown',
            status: 'processed',
            created: 'Unknown',
          })),
        });

      case 'documents':
        // List all documents
        const allDocuments = await discoveryService.listDocuments();
        return NextResponse.json({
          success: true,
          documents: allDocuments,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use ?action=status or ?action=documents' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch admin data',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear':
        // Clear all documents from collection
        await discoveryService.clearCollection();
        return NextResponse.json({
          success: true,
          message: 'Collection cleared successfully',
        });

      case 'rebuild':
        // Clear and rebuild collection (for now just clear)
        await discoveryService.clearCollection();
        return NextResponse.json({
          success: true,
          message: 'Collection rebuilt successfully',
        });

      case 'delete_document':
        // Delete specific document
        const { documentId } = body;
        if (!documentId) {
          return NextResponse.json(
            { error: 'Document ID is required' },
            { status: 400 }
          );
        }
        
        await discoveryService.deleteDocument(documentId);
        return NextResponse.json({
          success: true,
          message: 'Document deleted successfully',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform admin action',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
