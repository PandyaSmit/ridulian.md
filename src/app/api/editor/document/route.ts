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
        const category = searchParams.get('category');
        const docId = searchParams.get('docId');

        if (!projectId || !category || !docId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // We assume docId already has or doesn't have an extension. getLoreDocument might expect docId without extension, 
        // let's strip it if it has one so StorageManager can add .mdx as default, or we can just read the exact doc.
        // StorageManager expects docId without extension because it forces `.${extension}`.
        const cleanDocId = docId.replace(/\.(md|mdx)$/, '');

        const content = await StorageManager.getLoreDocument(category, cleanDocId, projectId, userId);

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
        const { projectId, category, docId, content } = body;

        if (!projectId || !category || !docId || typeof content !== 'string') {
            return NextResponse.json({ error: 'Missing required parameters or malformed body' }, { status: 400 });
        }

        const cleanDocId = docId.replace(/\.(md|mdx)$/, '');

        await StorageManager.saveLoreDocument(category, cleanDocId, content, projectId, userId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error saving document:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
