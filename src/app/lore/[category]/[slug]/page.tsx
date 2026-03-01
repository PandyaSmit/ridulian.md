import { getEntryBySlug, getAllCategories, getAllEntries } from '@/lib/markdown';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Timeline from '@/components/Timeline';
import Link from 'next/link';
import type { Metadata, ResolvingMetadata } from 'next';
import { FadeIn } from '@/components/MotionWrapper';

export async function generateStaticParams() {
    const categories = getAllCategories();
    const paths: { category: string; slug: string }[] = [];

    categories.forEach(category => {
        const entries = getAllEntries(category);
        entries.forEach(entry => {
            paths.push({
                category,
                slug: entry.slug,
            });
        });
    });

    return paths;
}

export async function generateMetadata(
    { params }: { params: Promise<{ category: string; slug: string }> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { category, slug } = await params;
    const entry = getEntryBySlug(category, slug);

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
    const entry = getEntryBySlug(category, slug);

    if (!entry) {
        notFound();
    }

    const { data, content } = entry;

    return (
        <div className="app-container">
            <nav className="top-nav">
                <Link href="/" className="nav-brand">ridulian.md</Link>
                <div className="nav-links">
                    <Link href="/graph">Universe Graph</Link>
                </div>
            </nav>

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
