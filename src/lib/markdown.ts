import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'content');

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

export function getAllCategories(): string[] {
    if (!fs.existsSync(contentDirectory)) return [];
    return fs.readdirSync(contentDirectory).filter(file => {
        return fs.statSync(path.join(contentDirectory, file)).isDirectory();
    });
}

export function getAllEntries(category: string): EntryData[] {
    const categoryPath = path.join(contentDirectory, category);
    if (!fs.existsSync(categoryPath)) return [];

    const filenames = fs.readdirSync(categoryPath);

    return filenames
        .filter(filename => filename.endsWith('.md') || filename.endsWith('.mdx'))
        .map(filename => {
            const slug = filename.replace(/\.mdx?$/, '');
            const fullPath = path.join(categoryPath, filename);
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const { data } = matter(fileContents);

            return {
                slug,
                category,
                title: data.title || slug,
                ...data,
            } as EntryData;
        });
}

export function getEntryBySlug(category: string, slug: string): Entry | null {
    try {
        const fullPathMDX = path.join(contentDirectory, category, `${slug}.mdx`);
        const fullPathMD = path.join(contentDirectory, category, `${slug}.md`);

        let fullPath = null;
        if (fs.existsSync(fullPathMDX)) {
            fullPath = fullPathMDX;
        } else if (fs.existsSync(fullPathMD)) {
            fullPath = fullPathMD;
        } else {
            return null;
        }

        const fileContents = fs.readFileSync(fullPath, 'utf8');
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
        return null;
    }
}

export function getGraphData() {
    const categories = getAllCategories();
    const nodes: any[] = [];
    const links: any[] = [];

    categories.forEach(category => {
        const entries = getAllEntries(category);
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

    return { nodes, links };
}
