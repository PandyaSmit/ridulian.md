import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TopNav from "@/components/TopNav";
import EditorWorkspace from "@/components/EditorWorkspace";

export default async function EditorPage({ params }: { params: Promise<{ projectId: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    const { projectId } = await params;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <TopNav />
            <EditorWorkspace projectId={projectId} />
        </div>
    );
}
