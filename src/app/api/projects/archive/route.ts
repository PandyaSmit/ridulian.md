import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { StorageManager } from '@/lib/StorageManager';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { projectId } = body;

        if (!projectId) {
            return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
        }

        await StorageManager.archiveProject(projectId, userId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error archiving project:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
