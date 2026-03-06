import matter from 'gray-matter';
import { StorageManager } from './StorageManager';

export interface Relationship {
    target: string; // e.g., 'factions/the-empire'
    type: string;
    description?: string;
}

export interface EntryData {
    slug: string;
    category: string;
    title: string;
    tags?: string[];
    relationships?: Relationship[];
    [key: string]: any;
}

export interface Entry {
    data: EntryData;
    content: string;
}

export async function getAllCategories(userId?: string): Promise<string[]> {
    return await StorageManager.getCategories(userId);
}

export async function getAllEntries(category: string, userId?: string): Promise<EntryData[]> {
    const filenames = await StorageManager.getEntriesByCategory(category, userId);

    // We fetch each document's content to parse frontmatter quickly
    // Note: In a production heavily-distributed cloud environment, this could heavily impact S3 limits.
    // For large scale, you'd index these instead.
    const entryPromises = filenames.map(async (filename) => {
        const slug = filename.replace(/\.mdx?$/, '');
        const extension = filename.endsWith('.mdx') ? 'mdx' : 'md';
        const fileContents = await StorageManager.getLoreDocument(category, slug, userId, extension);

        if (!fileContents) return null;

        const { data } = matter(fileContents);
        return {
            slug,
            category,
            title: data.title || slug,
            ...data,
        } as EntryData;
    });

    const results = await Promise.all(entryPromises);
    return results.filter(Boolean) as EntryData[];
}

export async function getEntryBySlug(category: string, slug: string, userId?: string): Promise<Entry | null> {
    try {
        let fileContents = await StorageManager.getLoreDocument(category, slug, userId, 'mdx');
        if (!fileContents) {
            fileContents = await StorageManager.getLoreDocument(category, slug, userId, 'md');
        }

        if (!fileContents) return null;

        const { data, content } = matter(fileContents);

        return {
            data: {
                slug,
                category,
                title: data.title || slug,
                ...data,
            } as EntryData,
            content,
        };
    } catch (e) {
        console.error(`Failed to parse markdown for slug ${slug}:`, e);
        return null;
    }
}

export async function getGraphData(userId?: string) {
    const categories = await getAllCategories(userId);
    const nodes: any[] = [];
    const links: any[] = [];

    // Parallelize categorical fetches
    const categoryPromises = categories.map(async (category) => {
        const entries = await getAllEntries(category, userId);
        entries.forEach(entry => {
            nodes.push({
                id: `${category}/${entry.slug}`,
                name: entry.title,
                group: category,
                ...entry
            });

            if (entry.relationships) {
                entry.relationships.forEach(rel => {
                    links.push({
                        source: `${category}/${entry.slug}`,
                        target: rel.target,
                        type: rel.type,
                        label: rel.description || rel.type
                    });
                });
            }
        });
    });

    await Promise.all(categoryPromises);

    return { nodes, links };
}
