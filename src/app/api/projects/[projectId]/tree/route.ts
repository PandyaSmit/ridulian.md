import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { StorageManager } from '@/lib/StorageManager';

// GET: Fetch the entire VFS Tree
export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { projectId } = await params;
        const tree = await StorageManager.getProjectTree(projectId, userId);

        return NextResponse.json(tree);
    } catch (error: any) {
        console.error('Error fetching VFS tree:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create a new Node
export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { projectId } = await params;
        const { name, type, parentId } = await req.json();

        if (!name || !type) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

        const newNode = await StorageManager.createNode(projectId, userId, name, type, parentId);

        return NextResponse.json(newNode, { status: 201 });
    } catch (error: any) {
        console.error('Error creating VFS node:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Rename a Node
export async function PUT(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { projectId } = await params;
        const { id, newName } = await req.json();

        if (!id || !newName) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

        const updatedNode = await StorageManager.renameNode(projectId, userId, id, newName);

        return NextResponse.json(updatedNode);
    } catch (error: any) {
        console.error('Error renaming VFS node:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Delete a Node
export async function DELETE(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { projectId } = await params;

        const { searchParams } = new URL(req.url);
        const nodeId = searchParams.get('id');

        if (!nodeId) return NextResponse.json({ error: 'Missing node id' }, { status: 400 });

        await StorageManager.deleteNode(projectId, userId, nodeId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting VFS node:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
