import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

export type StorageMode = 'LOCAL' | 'CLOUD';

export const STORAGE_MODE: StorageMode = (process.env.STORAGE_MODE as StorageMode) || 'LOCAL';

// Optional: Fallback AWS Region, credentials should be picked up from env or IAM
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'ridulian-lore-bucket';

const contentDirectory = path.join(process.cwd(), 'content');

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

    /**
     * Retrieves all categories (directories) available
     */
    static async getCategories(userId?: string): Promise<string[]> {
        if (STORAGE_MODE === 'CLOUD') {
            if (!userId) throw new Error("userId is required for CLOUD storage mode");

            const prefix = `users/${userId}/`;
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
            if (!fs.existsSync(contentDirectory)) return [];
            return fs.promises.readdir(contentDirectory).then(files => {
                return files.filter(file => fs.statSync(path.join(contentDirectory, file)).isDirectory());
            });
        }
    }

    /**
     * Retrieves all entry filenames (slugs with extension) for a given category
     */
    static async getEntriesByCategory(category: string, userId?: string): Promise<string[]> {
        if (STORAGE_MODE === 'CLOUD') {
            if (!userId) throw new Error("userId is required for CLOUD storage mode");

            const prefix = `users/${userId}/${category}/`;
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
            const categoryPath = path.join(contentDirectory, category);
            if (!fs.existsSync(categoryPath)) return [];

            const filenames = await fs.promises.readdir(categoryPath);
            return filenames.filter(filename => filename.endsWith('.md') || filename.endsWith('.mdx'));
        }
    }

    /**
     * Fetches the raw content string of a specific Markdown document
     */
    static async getLoreDocument(category: string, docId: string, userId?: string, extension: string = 'mdx'): Promise<string | null> {
        if (STORAGE_MODE === 'CLOUD') {
            if (!userId) throw new Error("userId is required for CLOUD storage mode");

            const key = `users/${userId}/${category}/${docId}.${extension}`;
            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key
            });

            try {
                const response = await s3Client.send(command);
                if (!response.Body) return null;
                return await this.streamToString(response.Body);
            } catch (error: any) {
                if (error.name === 'NoSuchKey') {
                    // Document not found with the preferred extension, fallback logic exists in the caller usually
                    return null;
                }
                console.error(`Error fetching document ${key} from S3:`, error);
                return null;
            }
        } else {
            // Local FS implementation
            const fullPath = path.join(contentDirectory, category, `${docId}.${extension}`);
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
     * Saves raw Markdown content to a specific document
     */
    static async saveLoreDocument(category: string, docId: string, content: string, userId?: string, extension: string = 'mdx'): Promise<void> {
        if (STORAGE_MODE === 'CLOUD') {
            if (!userId) throw new Error("userId is required for CLOUD storage mode");

            const key = `users/${userId}/${category}/${docId}.${extension}`;
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
            const categoryPath = path.join(contentDirectory, category);
            if (!fs.existsSync(categoryPath)) {
                await fs.promises.mkdir(categoryPath, { recursive: true });
            }

            const fullPath = path.join(categoryPath, `${docId}.${extension}`);
            await fs.promises.writeFile(fullPath, content, 'utf8');
        }
    }
}
