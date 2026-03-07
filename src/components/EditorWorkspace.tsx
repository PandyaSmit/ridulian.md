"use client";

import { useState, useEffect, useCallback } from 'react';
import { Editor, useMonaco } from '@monaco-editor/react';
import { FadeIn } from './MotionWrapper';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { MDXRemote as MDXRemoteClient } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Timeline from './Timeline';
import Link from 'next/link';
import { Folder, File, Plus, Edit2, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

export interface VFSNode {
    id: string;
    type: 'folder' | 'file';
    name: string;
    parentId: string | null;
    storageKey: string;
    status: 'active' | 'deleted';
}

export interface RenderNode extends VFSNode {
    children: RenderNode[];
}

const buildTreeLayout = (nodes: VFSNode[], parentId: string | null = null): RenderNode[] => {
    return nodes
        .filter(n => n.parentId === parentId && n.status !== 'deleted')
        .map(n => ({
            ...n,
            children: buildTreeLayout(nodes, n.id)
        }))
        .sort((a, b) => {
            if (a.type === 'folder' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });
};

const TreeNode = ({ node, level = 0, onSelect, onAction, activeNodeId }: { node: RenderNode, level?: number, onSelect: (node: VFSNode) => void, onAction: (action: string, target: RenderNode | null) => void, activeNodeId: string | undefined }) => {
    // Default open if it's the root level
    const [isOpen, setIsOpen] = useState(level === 0);
    const [isHovered, setIsHovered] = useState(false);

    const isFile = node.type === 'file';
    const isActive = activeNodeId === node.id;

    return (
        <div style={{ marginLeft: level > 0 ? '12px' : '0' }}>
            <div
                className={`tree-node ${isActive ? 'active' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => {
                    if (isFile) onSelect(node);
                    else setIsOpen(!isOpen);
                }}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.5rem',
                    cursor: 'pointer', color: isActive ? 'var(--accent)' : 'var(--foreground)',
                    fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
                    background: isActive ? 'rgba(182, 155, 116, 0.1)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: 0, opacity: isFile ? 0.9 : 1 }}>
                    {!isFile && (isOpen ? <ChevronDown size={14} style={{ flexShrink: 0 }} /> : <ChevronRight size={14} style={{ flexShrink: 0 }} />)}
                    {isFile && <File size={14} style={{ flexShrink: 0 }} />}
                    {!isFile && <Folder size={14} style={{ flexShrink: 0 }} />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}{isFile ? '.mdx' : ''}</span>
                </div>

                {isHovered && (
                    <div style={{ display: 'flex', gap: '0.4rem', color: 'var(--interactive)' }} onClick={(e) => e.stopPropagation()}>
                        {!isFile && (
                            <span title="New File/Folder in this directory"><Plus size={14} onClick={() => { setIsOpen(true); onAction('create', node); }} style={{ cursor: 'pointer' }} /></span>
                        )}
                        <span title="Rename"><Edit2 size={12} onClick={() => onAction('rename', node)} style={{ cursor: 'pointer' }} /></span>
                        <span title="Seal"><Trash2 size={12} onClick={() => onAction('delete', node)} style={{ cursor: 'pointer', color: 'var(--danger)' }} /></span>
                    </div>
                )}
            </div>

            {!isFile && isOpen && node.children.map(child => (
                <TreeNode key={child.id} node={child} level={level + 1} onSelect={onSelect} onAction={onAction} activeNodeId={activeNodeId} />
            ))}
        </div>
    );
};

export default function EditorWorkspace({ projectId }: { projectId: string }) {
    const [nodes, setNodes] = useState<VFSNode[]>([]);
    const [activeNode, setActiveNode] = useState<VFSNode | null>(null);
    const [content, setContent] = useState<string>('');
    const [mdxSource, setMdxSource] = useState<any>(null);
    const [isCompiling, setIsCompiling] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingNode, setIsLoadingNode] = useState(false);
    const monaco = useMonaco();

    // Setup Custom Monaco Theme
    useEffect(() => {
        if (monaco) {
            monaco.editor.defineTheme('imperial-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                    { token: '', background: '161412' },
                    { token: 'keyword', foreground: 'B69B74' },
                    { token: 'string', foreground: 'B3A895' },
                    { token: 'number', foreground: '4B90E2' },
                    { token: 'comment', foreground: '5A5043', fontStyle: 'italic' }
                ],
                colors: {
                    'editor.background': '#161412',
                    'editor.foreground': '#E8DCC2',
                    'editorCursor.foreground': '#B69B74',
                    'editor.lineHighlightBackground': '#1A1715',
                    'editorLineNumber.foreground': '#4A4136',
                    'editor.selectionBackground': 'rgba(182, 155, 116, 0.2)',
                    'editor.inactiveSelectionBackground': 'rgba(182, 155, 116, 0.1)'
                }
            });
            monaco.editor.setTheme('imperial-dark');
        }
    }, [monaco]);

    // Live MDX Compilation
    useEffect(() => {
        const compileMdx = async () => {
            setIsCompiling(true);
            try {
                // Strip frontmatter for the live, raw preview to prevent crashing the basic compiler
                const contentWithoutFrontmatter = content.replace(/^---[\s\S]+?---/, '');
                const mdxSource = await serialize(contentWithoutFrontmatter);
                setMdxSource(mdxSource);
            } catch (err) {
                console.error("MDX Compilation Error:", err);
            } finally {
                setIsCompiling(false);
            }
        };

        const timeoutId = setTimeout(compileMdx, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [content]);

    // For Action Modals
    const [showNewFileModal, setShowNewFileModal] = useState(false);
    const [modalActionTarget, setModalActionTarget] = useState<RenderNode | null>(null);
    const [newNodeType, setNewNodeType] = useState<'file' | 'folder'>('file');
    const [newFileName, setNewFileName] = useState('');

    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameValue, setRenameValue] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const fetchTree = useCallback(async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}/tree`);
            if (res.ok) {
                const data = await res.json();
                setNodes(data);
            }
        } catch (e) {
            console.error(e);
        }
    }, [projectId]);

    useEffect(() => {
        fetchTree();
    }, [fetchTree]);

    const handleSelectFile = async (node: VFSNode) => {
        if (activeNode?.id === node.id) return;
        if (node.type !== 'file') return;

        setIsLoadingNode(true);
        setActiveNode(node);
        try {
            const res = await fetch(`/api/editor/document?projectId=${projectId}&storageKey=${encodeURIComponent(node.storageKey)}`);
            if (res.ok) {
                const data = await res.json();
                setContent(data.content);
            } else {
                setContent('');
            }
        } catch (e) {
            console.error(e);
            setContent('');
        } finally {
            setIsLoadingNode(false);
        }
    };

    const handleSave = async () => {
        if (!activeNode) return;
        setIsSaving(true);
        try {
            await fetch(`/api/editor/document`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    storageKey: activeNode.storageKey,
                    content
                })
            });
            fetchTree();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    // Listen for Ctrl+S
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeNode, content]);

    const handleAction = async (action: string, target: RenderNode | null) => {
        if (action === 'create') {
            setModalActionTarget(target);
            setNewFileName('');
            setShowNewFileModal(true);
        } else if (action === 'delete') {
            if (!target) return;
            setModalActionTarget(target);
            setShowDeleteModal(true);
        } else if (action === 'rename') {
            if (!target) return;
            setModalActionTarget(target);
            setRenameValue(target.name);
            setShowRenameModal(true);
        }
    };

    const confirmDelete = async () => {
        if (!modalActionTarget) return;
        try {
            await fetch(`/api/projects/${projectId}/tree?id=${modalActionTarget.id}`, { method: 'DELETE' });
            if (activeNode?.id === modalActionTarget.id) {
                setActiveNode(null);
                setContent('');
            }
            fetchTree();
        } catch (e) { console.error(e); }
        setShowDeleteModal(false);
        setModalActionTarget(null);
    };

    const confirmRename = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalActionTarget || !renameValue.trim() || renameValue === modalActionTarget.name) {
            setShowRenameModal(false);
            setModalActionTarget(null);
            return;
        }

        try {
            await fetch(`/api/projects/${projectId}/tree`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: modalActionTarget.id, newName: renameValue.trim() })
            });
            fetchTree();
            if (activeNode?.id === modalActionTarget.id) {
                setActiveNode({ ...activeNode, name: renameValue.trim() });
            }
        } catch (e) { console.error(e); }

        setShowRenameModal(false);
        setModalActionTarget(null);
    };

    const handleCreateNewFile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFileName.trim()) return;

        const safeFileName = newFileName.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '-');

        try {
            const res = await fetch(`/api/projects/${projectId}/tree`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: safeFileName,
                    type: newNodeType,
                    parentId: modalActionTarget?.id || null
                })
            });

            if (res.ok) {
                const node = await res.json();
                fetchTree();

                if (newNodeType === 'file') {
                    setActiveNode(node);
                    setContent(`---\ntitle: "${newFileName}"\ndescription: ""\ntags: []\n---\n\nInitial log sequence...`);
                }
            }
        } catch (e) { console.error(e); }

        setShowNewFileModal(false);
        setNewFileName('');
        setModalActionTarget(null);
    };

    const rootNodes = buildTreeLayout(nodes, null);

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)', width: '100vw', marginTop: 1, borderTop: '1px solid var(--border)' }}>

            {/* Sidebar */}
            <aside style={{ width: '280px', borderRight: '1px solid var(--border)', background: 'var(--background)', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>The Archives</h3>
                    <button
                        onClick={() => handleAction('create', null)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}
                    >
                        <Plus size={14} /> NEW
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                    {rootNodes.map(node => (
                        <TreeNode key={node.id} node={node} level={0} onSelect={handleSelectFile} onAction={handleAction} activeNodeId={activeNode?.id} />
                    ))}
                    {rootNodes.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>
                            No tomes found.
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Editor Area */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--background)', position: 'relative' }}>
                {activeNode ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--accent)' }}>/</span>{activeNode.storageKey}.mdx
                                </span>
                                {isLoadingNode && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', animation: 'pulse 1.5s infinite' }}>Loading...</span>}
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || isLoadingNode}
                                className="btn-auth"
                                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', color: 'var(--interactive)', borderColor: 'var(--interactive)' }}
                            >
                                {isSaving ? '[ SCRIBING... ]' : '[ SCRIBE LORE ]'}
                            </button>
                        </div>

                        <div style={{ flex: 1, display: 'flex' }}>
                            {/* LEFT PANE: Monaco Editor */}
                            <div style={{ flex: 1, borderRight: '1px solid var(--border)' }}>
                                <Editor
                                    height="100%"
                                    defaultLanguage="markdown"
                                    theme="imperial-dark"
                                    value={content}
                                    onChange={(val) => setContent(val || '')}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        fontFamily: 'monospace',
                                        wordWrap: 'on',
                                        lineHeight: 1.6,
                                        padding: { top: 24, bottom: 24 },
                                        scrollBeyondLastLine: false,
                                        smoothScrolling: true,
                                    }}
                                />
                            </div>

                            {/* RIGHT PANE: Live MDX Preview */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem', background: 'var(--background)' }} className="prose">
                                {isCompiling && (
                                    <div style={{ position: 'absolute', top: '4rem', right: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Compiling...
                                    </div>
                                )}
                                {mdxSource ? (
                                    <MDXRemoteClient
                                        {...mdxSource}
                                        components={{
                                            Timeline,
                                            a: (props: any) => {
                                                const href = props.href;
                                                if (href?.startsWith('/')) {
                                                    const scopedHref = `/editor/${projectId}/lore${href}`;
                                                    return <Link href={scopedHref} {...props} />;
                                                }
                                                return <a target="_blank" rel="noopener noreferrer" {...props} />;
                                            }
                                        }}
                                    />
                                ) : (
                                    <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                        Awaiting input...
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'var(--font-serif)', color: 'var(--accent)' }}>Archive Open</h2>
                            <p style={{ fontFamily: 'var(--font-mono)' }}>Select or create a parchment to begin data entry.</p>
                        </div>
                    </div>
                )}
            </main>

            {/* New File Modal */}
            {showNewFileModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <FadeIn>
                        <div style={{ background: 'var(--background)', padding: '2rem', border: '1px solid var(--border)', width: '400px', boxShadow: '0 0 20px rgba(0,0,0,0.5)', borderRadius: '4px' }}>
                            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-serif)', color: 'var(--foreground)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>INITIALIZE NEW {newNodeType === 'folder' ? 'DIRECTORY' : 'SCROLL'}</h3>

                            {modalActionTarget && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>
                                    Target Location: <span style={{ color: 'var(--accent)' }}>/{modalActionTarget.storageKey}</span>
                                </p>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', color: newNodeType === 'file' ? 'var(--interactive)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                    <input type="radio" checked={newNodeType === 'file'} onChange={() => setNewNodeType('file')} />
                                    File Node
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', color: newNodeType === 'folder' ? 'var(--interactive)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                    <input type="radio" checked={newNodeType === 'folder'} onChange={() => setNewNodeType('folder')} />
                                    Directory Node
                                </label>
                            </div>

                            <form onSubmit={handleCreateNewFile}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '1px' }}>SCROLL DESIGNATION</label>
                                    <input
                                        type="text"
                                        value={newFileName}
                                        onChange={(e) => setNewFileName(e.target.value)}
                                        placeholder="e.g. luke-skywalker"
                                        style={{ width: '100%', padding: '0.5rem', background: '#0A0908', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none', fontFamily: 'monospace' }}
                                        autoFocus
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button type="button" onClick={() => setShowNewFileModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>[ CANCEL ]</button>
                                    <button type="submit" className="btn-auth" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>[ INITIATE ]</button>
                                </div>
                            </form>
                        </div>
                    </FadeIn>
                </div>
            )}

            {/* Rename Modal */}
            {showRenameModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <FadeIn>
                        <div style={{ background: 'var(--background)', padding: '2rem', border: '1px solid var(--border)', width: '400px', boxShadow: '0 0 20px rgba(0,0,0,0.5)', borderRadius: '4px' }}>
                            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-serif)', color: 'var(--foreground)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>RENAME SCROLL</h3>

                            <form onSubmit={confirmRename}>
                                <div style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '1px' }}>NEW DESIGNATION</label>
                                    <input
                                        type="text"
                                        value={renameValue}
                                        onChange={(e) => setRenameValue(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', background: '#0A0908', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none', fontFamily: 'monospace' }}
                                        autoFocus
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button type="button" onClick={() => setShowRenameModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>[ CANCEL ]</button>
                                    <button type="submit" className="btn-auth" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>[ RENAME ]</button>
                                </div>
                            </form>
                        </div>
                    </FadeIn>
                </div>
            )}

            {/* Delete/Seal Modal */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <FadeIn>
                        <div style={{ background: 'var(--background)', padding: '2rem', border: '1px solid var(--danger)', width: '400px', boxShadow: '0 0 20px rgba(139, 58, 58, 0.2)', borderRadius: '4px' }}>
                            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-serif)', color: 'var(--danger)', borderBottom: '1px solid var(--danger)', paddingBottom: '0.5rem' }}>SEAL ARCHIVE</h3>

                            <p style={{ fontSize: '0.9rem', color: 'var(--foreground)', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)' }}>
                                Are you certain you wish to seal <span style={{ color: 'var(--accent)' }}>{modalActionTarget?.name}</span>? This will obscure it from the Codex.
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowDeleteModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>[ CANCEL ]</button>
                                <button onClick={confirmDelete} className="btn-auth" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}>[ SEAL ]</button>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            )}
        </div>
    );
}
