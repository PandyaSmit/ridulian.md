import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TopNav from "@/components/TopNav";

export default async function EditorPage({ params }: { params: Promise<{ projectId: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    const { projectId } = await params;

    return (
        <div className="app-container">
            <TopNav />
            <main className="main-content" style={{ marginTop: '2rem' }}>
                <h1 style={{ color: 'var(--accent)' }}>ACTIVE TERMINAL: <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{projectId.split('-')[0]}</span></h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    System initialized. Editor module pending installation...
                </p>
            </main>
        </div>
    );
}
