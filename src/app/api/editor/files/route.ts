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

        if (!projectId) {
            return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
        }

        const categories = await StorageManager.getCategories(projectId, userId);

        const filesTree = [];
        for (const category of categories) {
            const entries = await StorageManager.getEntriesByCategory(category, projectId, userId);
            filesTree.push({
                category,
                entries
            });
        }

        return NextResponse.json(filesTree);
    } catch (error: any) {
        console.error('Error fetching files tree:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
