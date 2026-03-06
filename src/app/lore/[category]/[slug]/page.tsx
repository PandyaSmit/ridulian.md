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
import { STORAGE_MODE } from '@/lib/StorageManager';

export async function generateStaticParams() {
    // If we are in CLOUD mode, paths depend on the specific user's bucket prefix.
    // Static generation at build time without a user session is impossible.
    // Return an empty array to force dynamic Server-Side Rendering (SSR) for all lore pages.
    if (STORAGE_MODE === 'CLOUD') {
        return [];
    }

    // For LOCAL mode, we can pre-generate paths
    const categories = await getAllCategories();
    const paths: { category: string; slug: string }[] = [];

    await Promise.all(categories.map(async (category) => {
        const entries = await getAllEntries(category);
        entries.forEach(entry => {
            paths.push({
                category,
                slug: entry.slug,
            });
        });
    }));

    return paths;
}

export async function generateMetadata(
    { params }: { params: Promise<{ category: string; slug: string }> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { category, slug } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const entry = await getEntryBySlug(category, slug, userId);

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

export default async function LorePage({ params }: { params: Promise<{ category: string; slug: string }> }) {
    const { category, slug } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const entry = await getEntryBySlug(category, slug, userId);

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
                                    return <Link href={href} {...props} />;
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
