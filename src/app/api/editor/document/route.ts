import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { StorageManager } from '@/lib/StorageManager';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');
        // Legacy fallback
        const category = searchParams.get('category');
        const docId = searchParams.get('docId');

        // New VFS standard
        const storageKey = searchParams.get('storageKey');

        if (!projectId) {
            return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
        }

        let content: string | null = null;

        if (storageKey) {
            content = await StorageManager.getVfsDocument(storageKey, projectId, userId);
        } else if (category && docId) {
            const cleanDocId = docId.replace(/\.(md|mdx)$/, '');
            content = await StorageManager.getLoreDocument(category, cleanDocId, projectId, userId);
        } else {
            return NextResponse.json({ error: 'Must provide storageKey or category/docId' }, { status: 400 });
        }

        if (!content) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json({ content });
    } catch (error: any) {
        console.error('Error fetching document:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { projectId, storageKey, category, docId, content } = body;

        if (!projectId || typeof content !== 'string') {
            return NextResponse.json({ error: 'Missing projectId or content' }, { status: 400 });
        }

        if (storageKey) {
            await StorageManager.saveVfsDocument(storageKey, content, projectId, userId);
        } else if (category && docId) {
            const cleanDocId = docId.replace(/\.(md|mdx)$/, '');
            await StorageManager.saveLoreDocument(category, cleanDocId, content, projectId, userId);
        } else {
            return NextResponse.json({ error: 'Must provide storageKey or category/docId' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error saving document:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
