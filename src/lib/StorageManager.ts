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
    updatedAt: string;
    status?: "active" | "deleted";
}

export interface VFSNode {
    id: string;
    type: 'folder' | 'file';
    name: string;
    parentId: string | null;
    storageKey: string;
    status: 'active' | 'deleted';
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
        const now = new Date().toISOString();
        const newProject: ProjectDef = {
            id: projectId,
            name: projectName,
            createdAt: now,
            updatedAt: now,
            status: "active"
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

    /**
     * Updates the `updatedAt` timestamp for a given project. 
     * Useful to call automatically whenever a document is saved.
     */
    static async updateProjectTimestamp(projectId: string, userId?: string): Promise<void> {
        const currentProjects = await this.getUserProjects(userId);
        const projIndex = currentProjects.findIndex(p => p.id === projectId);
        if (projIndex === -1) return;

        currentProjects[projIndex].updatedAt = new Date().toISOString();
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
            const p = path.join(process.cwd(), 'projects.json');
            await fs.promises.writeFile(p, updatedContent, 'utf8');
        }
    }

    /**
     * Soft deletes a project by toggling its status flag to 'deleted'
     */
    static async archiveProject(projectId: string, userId?: string): Promise<void> {
        const currentProjects = await this.getUserProjects(userId);
        const projIndex = currentProjects.findIndex(p => p.id === projectId);
        if (projIndex === -1) throw new Error("Project not found");

        currentProjects[projIndex].status = "deleted";
        currentProjects[projIndex].updatedAt = new Date().toISOString();
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
            const p = path.join(process.cwd(), 'projects.json');
            await fs.promises.writeFile(p, updatedContent, 'utf8');
        }
    }

    // ==========================================
    // VFS MANAGER (Virtual File System)
    // ==========================================

    static async getProjectTree(projectId: string, userId?: string): Promise<VFSNode[]> {
        if (STORAGE_MODE === 'CLOUD') {
            if (!userId) throw new Error("userId is required for CLOUD storage mode");
            const key = `users/${userId}/projects/${projectId}/project-index.json`;
            const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });

            try {
                const response = await s3Client.send(command);
                if (response.Body) {
                    const content = await this.streamToString(response.Body);
                    return JSON.parse(content) as VFSNode[];
                }
            } catch (error: any) {
                if (error.name !== 'NoSuchKey') {
                    console.error("Error fetching VFS from S3:", error);
                }
            }
            return [];
        } else {
            // Local FS Implementation
            const nodes: VFSNode[] = [];
            const projectRoot = path.join(contentDirectory, projectId);

            if (!fs.existsSync(projectRoot)) {
                return [];
            }

            const walkSync = (currentDirPath: string, parentId: string | null) => {
                const items = fs.readdirSync(currentDirPath);

                for (const item of items) {
                    const fullPath = path.join(currentDirPath, item);
                    const stat = fs.statSync(fullPath);
                    const isDirectory = stat.isDirectory();

                    if (!isDirectory && !item.endsWith('.md') && !item.endsWith('.mdx')) {
                        continue;
                    }

                    let storageKey = path.relative(projectRoot, fullPath).replace(/\\/g, '/');
                    if (!isDirectory) {
                        storageKey = storageKey.replace(/\.mdx?$/, '');
                    }

                    // Deterministic ID based on relative path
                    const id = crypto.createHash('sha256').update(storageKey).digest('hex').substring(0, 16);

                    const name = isDirectory ? item : item.replace(/\.mdx?$/, '');

                    nodes.push({
                        id,
                        type: isDirectory ? 'folder' : 'file',
                        name,
                        parentId,
                        storageKey,
                        status: 'active'
                    });

                    if (isDirectory) {
                        walkSync(fullPath, id);
                    }
                }
            };

            walkSync(projectRoot, null);
            return nodes;
        }
    }

    static async createNode(projectId: string, userId: string | undefined, name: string, type: 'folder' | 'file', parentId: string | null): Promise<VFSNode> {
        const tree = await this.getProjectTree(projectId, userId);

        let parentPath = '';
        if (parentId) {
            const parentNode = tree.find(n => n.id === parentId);
            if (parentNode) {
                parentPath = parentNode.storageKey;
            }
        }

        const storageKey = parentPath ? `${parentPath}/${name}` : name;
        const id = crypto.createHash('sha256').update(storageKey).digest('hex').substring(0, 16);

        const newNode: VFSNode = {
            id,
            type,
            name,
            parentId,
            storageKey,
            status: 'active'
        };

        if (STORAGE_MODE === 'CLOUD') {
            if (!userId) throw new Error("userId is required for CLOUD storage mode");
            tree.push(newNode);

            const key = `users/${userId}/projects/${projectId}/project-index.json`;
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: JSON.stringify(tree, null, 2),
                ContentType: 'application/json'
            });
            await s3Client.send(command);
        } else {
            const fullPath = path.join(contentDirectory, projectId, storageKey);
            if (type === 'folder') {
                await fs.promises.mkdir(fullPath, { recursive: true });
            } else {
                const filePath = `${fullPath}.mdx`;
                // Ensure parent directory exists in case it was missed
                await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
                await fs.promises.writeFile(filePath, `---\ntitle: ${name}\ndescription: \n---\n`, 'utf8');
            }
        }

        return newNode;
    }

    static async renameNode(projectId: string, userId: string | undefined, nodeId: string, newName: string): Promise<VFSNode> {
        const tree = await this.getProjectTree(projectId, userId);
        const nodeIndex = tree.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) throw new Error("Node not found");

        const node = tree[nodeIndex];
        const oldStorageKey = node.storageKey;

        const parts = oldStorageKey.split('/');
        parts[parts.length - 1] = newName;
        const newStorageKey = parts.join('/');

        node.name = newName;
        node.storageKey = newStorageKey;

        if (STORAGE_MODE === 'CLOUD') {
            if (!userId) throw new Error("userId is required for CLOUD storage mode");

            const cascadeRename = (parentId: string, currentPath: string) => {
                const children = tree.filter(n => n.parentId === parentId);
                for (const child of children) {
                    child.storageKey = `${currentPath}/${child.name}`;
                    cascadeRename(child.id, child.storageKey);
                }
            };
            cascadeRename(node.id, node.storageKey);

            const key = `users/${userId}/projects/${projectId}/project-index.json`;
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: JSON.stringify(tree, null, 2),
                ContentType: 'application/json'
            });
            await s3Client.send(command);
        } else {
            const oldPath = node.type === 'folder'
                ? path.join(contentDirectory, projectId, oldStorageKey)
                : path.join(contentDirectory, projectId, `${oldStorageKey}.mdx`); // Fallback logic usually favors .mdx here

            let actualOldPath = oldPath;
            if (node.type === 'file' && !fs.existsSync(oldPath)) {
                actualOldPath = path.join(contentDirectory, projectId, `${oldStorageKey}.md`);
            }

            const newPath = node.type === 'folder'
                ? path.join(contentDirectory, projectId, newStorageKey)
                : path.join(contentDirectory, projectId, `${newStorageKey}.mdx`);

            if (fs.existsSync(actualOldPath)) {
                await fs.promises.rename(actualOldPath, newPath);
            } else {
                console.warn(`Attempted to rename non-existent file: ${actualOldPath}`);
            }
        }

        return node;
    }

    static async deleteNode(projectId: string, userId: string | undefined, nodeId: string): Promise<void> {
        const tree = await this.getProjectTree(projectId, userId);
        const nodeIndex = tree.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) throw new Error("Node not found");

        const node = tree[nodeIndex];

        if (STORAGE_MODE === 'CLOUD') {
            if (!userId) throw new Error("userId is required for CLOUD storage mode");

            const cascadeDelete = (targetId: string) => {
                const target = tree.find(n => n.id === targetId);
                if (target) target.status = 'deleted';

                const children = tree.filter(n => n.parentId === targetId);
                for (const child of children) {
                    cascadeDelete(child.id);
                }
            };

            cascadeDelete(nodeId);

            const key = `users/${userId}/projects/${projectId}/project-index.json`;
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: JSON.stringify(tree, null, 2),
                ContentType: 'application/json'
            });
            await s3Client.send(command);
        } else {
            const targetPath = node.type === 'folder'
                ? path.join(contentDirectory, projectId, node.storageKey)
                : path.join(contentDirectory, projectId, `${node.storageKey}.md`);

            const targetPathMdx = path.join(contentDirectory, projectId, `${node.storageKey}.mdx`);

            if (node.type === 'folder') {
                if (fs.existsSync(targetPath)) await fs.promises.rm(targetPath, { recursive: true, force: true });
            } else {
                if (fs.existsSync(targetPath)) await fs.promises.rm(targetPath);
                if (fs.existsSync(targetPathMdx)) await fs.promises.rm(targetPathMdx);
            }
        }
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
     * VFS-native Content Fetcher
     */
    static async getVfsDocument(storageKey: string, projectId: string, userId?: string): Promise<string | null> {
        if (STORAGE_MODE === 'CLOUD') {
            if (!userId) throw new Error("userId is required for CLOUD storage mode");

            const key = `users/${userId}/projects/${projectId}/${storageKey}.mdx`;
            const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });

            try {
                const response = await s3Client.send(command);
                if (!response.Body) return null;
                return await this.streamToString(response.Body);
            } catch (error: any) {
                if (error.name === 'NoSuchKey') {
                    // Try fallback to .md
                    const keyMd = `users/${userId}/projects/${projectId}/${storageKey}.md`;
                    try {
                        const fallbackResponse = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: keyMd }));
                        if (fallbackResponse.Body) return await this.streamToString(fallbackResponse.Body);
                    } catch (e) {
                        return null;
                    }
                }
                console.error(`Error fetching document ${key} from S3:`, error);
                return null;
            }
        } else {
            const mdxPath = path.join(contentDirectory, projectId, `${storageKey}.mdx`);
            const mdPath = path.join(contentDirectory, projectId, `${storageKey}.md`);

            if (fs.existsSync(mdxPath)) return await fs.promises.readFile(mdxPath, 'utf8');
            if (fs.existsSync(mdPath)) return await fs.promises.readFile(mdPath, 'utf8');

            return null;
        }
    }

    /**
     * VFS-native Content Saver
     */
    static async saveVfsDocument(storageKey: string, content: string, projectId: string, userId?: string): Promise<void> {
        if (STORAGE_MODE === 'CLOUD') {
            if (!userId) throw new Error("userId is required for CLOUD storage mode");

            const key = `users/${userId}/projects/${projectId}/${storageKey}.mdx`;
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: content,
                ContentType: 'text/markdown'
            });

            try {
                await s3Client.send(command);
                await this.updateProjectTimestamp(projectId, userId);
            } catch (error) {
                console.error(`Error saving document ${key} to S3:`, error);
                throw error;
            }
        } else {
            const fullPath = path.join(contentDirectory, projectId, `${storageKey}.mdx`);
            await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.promises.writeFile(fullPath, content, 'utf8');
            await this.updateProjectTimestamp(projectId, userId);
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
                await this.updateProjectTimestamp(projectId, userId);
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
            await this.updateProjectTimestamp(projectId, userId);
        }
    }
}
