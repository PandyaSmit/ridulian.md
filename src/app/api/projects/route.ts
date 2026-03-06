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

        const { projectName } = await req.json();

        if (!projectName || typeof projectName !== 'string') {
            return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
        }

        const projectId = await StorageManager.createProject(projectName, userId);

        return NextResponse.json({ projectId, name: projectName });
    } catch (error: any) {
        console.error('Error creating project:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
