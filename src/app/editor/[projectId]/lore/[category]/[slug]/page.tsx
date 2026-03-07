import { getEntryBySlug, getAllCategories, getAllEntries } from '@/lib/markdown';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Timeline from '@/components/Timeline';
import Link from 'next/link';
import TopNav from '@/components/TopNav';
import type { Metadata, ResolvingMetadata } from 'next';
import { FadeIn } from '@/components/MotionWrapper';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { STORAGE_MODE, StorageManager } from '@/lib/StorageManager';

type PageProps = { params: Promise<{ projectId: string; category: string; slug: string }> };

export async function generateStaticParams() {
    if (STORAGE_MODE === 'CLOUD') {
        return [];
    }

    const projects = await StorageManager.getUserProjects();
    const paths: { projectId: string; category: string; slug: string }[] = [];

    for (const proj of projects) {
        const categories = await getAllCategories(proj.id);
        for (const category of categories) {
            const entries = await getAllEntries(category, proj.id);
            for (const entry of entries) {
                paths.push({ projectId: proj.id, category, slug: entry.slug });
            }
        }
    }

    return paths;
}

export async function generateMetadata(
    { params }: PageProps,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { projectId, category, slug } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const entry = await getEntryBySlug(category, slug, projectId, userId);

    if (!entry) {
        return {
            title: 'Not Found',
        };
    }

    return {
        title: `${entry.data.title} | ridulian.md`,
        description: entry.data.description || `Read about ${entry.data.title} in the ${category} category.`,
        keywords: entry.data.tags,
    };
}

export default async function LorePage({ params }: PageProps) {
    const { projectId, category, slug } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const entry = await getEntryBySlug(category, slug, projectId, userId);

    if (!entry) {
        notFound();
    }

    const { data, content } = entry;

    return (
        <div className="app-container">
            <TopNav />

            <main className="main-content lore-article">
                <FadeIn className="article-header">
                    <div className="article-meta">
                        <span className="category-tag">{category}</span>
                        {data.tags && data.tags.map((tag: string) => (
                            <span key={tag} className="tag">#{tag}</span>
                        ))}
                    </div>
                    <h1 className="article-title">{data.title}</h1>
                </FadeIn>

                <FadeIn delay={0.2} className="prose">
                    <MDXRemote
                        source={content}
                        components={{
                            Timeline,
                            a: (props: any) => {
                                const href = props.href;
                                if (href?.startsWith('/')) {
                                    // Scope relative markdown links to current project
                                    const scopedHref = `/editor/${projectId}/lore${href}`;
                                    return <Link href={scopedHref} {...props} />;
                                }
                                return <a target="_blank" rel="noopener noreferrer" {...props} />;
                            }
                        }}
                    />
                </FadeIn>
            </main>
        </div>
    );
}
