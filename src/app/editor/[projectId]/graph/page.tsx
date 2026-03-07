import { getGraphData } from '@/lib/markdown';
import GraphView from '@/components/GraphView';
import TopNav from '@/components/TopNav';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

type PageProps = { params: Promise<{ projectId: string }> };

export default async function GraphPage({ params }: PageProps) {
    const { projectId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const data = await getGraphData(projectId, userId);

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 100 }}>
                <TopNav />
            </div>
            <GraphView initialData={data} />
        </div>
    );
}
