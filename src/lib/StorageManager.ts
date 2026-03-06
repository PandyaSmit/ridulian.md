import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type StorageMode = 'LOCAL' | 'CLOUD';

export const STORAGE_MODE: StorageMode = (process.env.STORAGE_MODE as StorageMode) || 'LOCAL';

// Optional: Fallback AWS Region, credentials should be picked up from env or IAM
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'ridulian-lore-bucket';

// In LOCAL mode, projects live under content/{projectId}/
const contentDirectory = path.join(process.cwd(), 'content');

export interface ProjectDef {
    id: string;
    name: string;
    createdAt: string;
}

export class StorageManager {
    /**
     * Helper to convert an S3 Stream to a string
     */
    private static async streamToString(stream: any): Promise<string> {
        const chunks: Buffer[] = [];
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
            stream.on('error', (err: Error) => reject(err));
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        });
    }

    // ==========================================
    // INDEX MANAGER (projects.json)
    // ==========================================

    /**
     * Fetches the user's project index.
     */
    static async getUserProjects(userId?: string): Promise<ProjectDef[]> {
        if (STORAGE_MODE === 'CLOUD') {
            if (!userId) throw new Error("userId is required for CLOUD storage mode");
            const key = `users/${userId}/projects.json`;
            const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });

            try {
                const response = await s3Client.send(command);
                if (!response.Body) return [];
                const content = await this.streamToString(response.Body);
                return JSON.parse(content);
            } catch (error: any) {
                if (error.name === 'NoSuchKey') return []; // New user
                console.error("Error fetching projects from S3:", error);
                return [];
            }
        } else {
            // Local FS implementation
            const p = path.join(process.cwd(), 'projects.json');
            if (!fs.existsSync(p)) return [];
            try {
                const content = await fs.promises.readFile(p, 'utf8');
                return JSON.parse(content);
            } catch (error) {
                console.error("Error fetching projects.json locally:", error);
                return [];
            }
        }
    }

    /**
     * Creates a new project in the user's index.
     */
    static async createProject(projectName: string, userId?: string): Promise<string> {
        const projectId = crypto.randomUUID();
        const newProject: ProjectDef = {
            id: projectId,
            name: projectName,
            createdAt: new Date().toISOString()
        };

        const currentProjects = await this.getUserProjects(userId);
        currentProjects.push(newProject);
        const updatedContent = JSON.stringify(currentProjects, null, 2);

        if (STORAGE_MODE === 'CLOUD') {
            if (!userId) throw new Error("userId is required for CLOUD storage mode");
            const key = `users/${userId}/projects.json`;
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: updatedContent,
                ContentType: 'application/json'
            });
            await s3Client.send(command);
        } else {
            // Local FS Implementation
            const p = path.join(process.cwd(), 'projects.json');
            await fs.promises.writeFile(p, updatedContent, 'utf8');

            // Pre-initialize the local content folder for this project
            const projectDir = path.join(contentDirectory, projectId);
            if (!fs.existsSync(projectDir)) {
                await fs.promises.mkdir(projectDir, { recursive: true });
            }
        }

        return projectId;
    }

    // ==========================================
    // DOCUMENT MANAGER
    // ==========================================

    /**
     * Retrieves all categories (directories) available for a specific project
     */
    static async getCategories(projectId: string, userId?: string): Promise<string[]> {
        if (STORAGE_MODE === 'CLOUD') {
            if (!userId) throw new Error("userId is required for CLOUD storage mode");

            const prefix = `users/${userId}/projects/${projectId}/`;
            const command = new ListObjectsV2Command({
                Bucket: BUCKET_NAME,
                Prefix: prefix,
                Delimiter: '/'
            });

            try {
                const response = await s3Client.send(command);
                if (!response.CommonPrefixes) return [];

                return response.CommonPrefixes.map(cp => {
                    const folderName = cp.Prefix?.replace(prefix, '').replace('/', '') || '';
                    return folderName;
                }).filter(Boolean);
            } catch (error) {
                console.error("Error fetching categories from S3:", error);
                return [];
            }
        } else {
            // Local FS implementation
            const projectDir = path.join(contentDirectory, projectId);
            if (!fs.existsSync(projectDir)) return [];
            return fs.promises.readdir(projectDir).then(files => {
                return files.filter(file => fs.statSync(path.join(projectDir, file)).isDirectory());
            });
        }
    }

    /**
     * Retrieves all entry filenames (slugs with extension) for a given category & project
     */
    static async getEntriesByCategory(category: string, projectId: string, userId?: string): Promise<string[]> {
        if (STORAGE_MODE === 'CLOUD') {
            if (!userId) throw new Error("userId is required for CLOUD storage mode");

            const prefix = `users/${userId}/projects/${projectId}/${category}/`;
            const command = new ListObjectsV2Command({
                Bucket: BUCKET_NAME,
                Prefix: prefix
            });

            try {
                const response = await s3Client.send(command);
                if (!response.Contents) return [];

                return response.Contents.map(obj => {
                    const key = obj.Key || '';
                    return key.replace(prefix, '');
                }).filter(filename => filename.endsWith('.md') || filename.endsWith('.mdx'));
            } catch (error) {
                console.error(`Error fetching entries for category ${category} from S3:`, error);
                return [];
            }
        } else {
            // Local FS implementation
            const categoryPath = path.join(contentDirectory, projectId, category);
            if (!fs.existsSync(categoryPath)) return [];

            const filenames = await fs.promises.readdir(categoryPath);
            return filenames.filter(filename => filename.endsWith('.md') || filename.endsWith('.mdx'));
        }
    }

    /**
     * Fetches the raw content string of a specific Markdown document within a project
     */
    static async getLoreDocument(category: string, docId: string, projectId: string, userId?: string, extension: string = 'mdx'): Promise<string | null> {
        if (STORAGE_MODE === 'CLOUD') {
            if (!userId) throw new Error("userId is required for CLOUD storage mode");

            const key = `users/${userId}/projects/${projectId}/${category}/${docId}.${extension}`;
            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key
            });

            try {
                const response = await s3Client.send(command);
                if (!response.Body) return null;
                return await this.streamToString(response.Body);
            } catch (error: any) {
                if (error.name === 'NoSuchKey') return null;
                console.error(`Error fetching document ${key} from S3:`, error);
                return null;
            }
        } else {
            // Local FS implementation
            const fullPath = path.join(contentDirectory, projectId, category, `${docId}.${extension}`);
            if (!fs.existsSync(fullPath)) return null;

            try {
                return await fs.promises.readFile(fullPath, 'utf8');
            } catch (error) {
                console.error(`Error reading local document ${fullPath}:`, error);
                return null;
            }
        }
    }

    /**
     * Saves raw Markdown content to a specific document inside a project
     */
    static async saveLoreDocument(category: string, docId: string, content: string, projectId: string, userId?: string, extension: string = 'mdx'): Promise<void> {
        if (STORAGE_MODE === 'CLOUD') {
            if (!userId) throw new Error("userId is required for CLOUD storage mode");

            const key = `users/${userId}/projects/${projectId}/${category}/${docId}.${extension}`;
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: content,
                ContentType: 'text/markdown'
            });

            try {
                await s3Client.send(command);
            } catch (error) {
                console.error(`Error saving document ${key} to S3:`, error);
                throw error;
            }
        } else {
            // Local FS implementation
            const categoryPath = path.join(contentDirectory, projectId, category);
            if (!fs.existsSync(categoryPath)) {
                await fs.promises.mkdir(categoryPath, { recursive: true });
            }

            const fullPath = path.join(categoryPath, `${docId}.${extension}`);
            await fs.promises.writeFile(fullPath, content, 'utf8');
        }
    }
}
