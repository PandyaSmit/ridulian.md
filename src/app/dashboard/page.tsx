import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StorageManager } from "@/lib/StorageManager";
import TopNav from "@/components/TopNav";
import ProjectList from "@/components/ProjectList";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    const userId = (session.user as any).id;
    const initialProjects = await StorageManager.getUserProjects(userId);

    return (
        <div className="app-container">
            <TopNav />
            <main className="main-content" style={{ marginTop: '2rem' }}>
                <ProjectList initialProjects={initialProjects} />
            </main>
        </div>
    );
}
