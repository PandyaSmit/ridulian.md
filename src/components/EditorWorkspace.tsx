"use client";

import { useState, useEffect, useCallback } from 'react';
import { Editor, useMonaco } from '@monaco-editor/react';
import { FadeIn } from './MotionWrapper';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { MDXRemote as MDXRemoteClient } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Timeline from './Timeline';

type FileTree = {
    category: string;
    entries: string[];
}[];

export default function EditorWorkspace({ projectId }: { projectId: string }) {
    const [fileTree, setFileTree] = useState<FileTree>([]);
    const [activeFile, setActiveFile] = useState<{ category: string; docId: string } | null>(null);
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

    // For new file creation
    const [showNewFileModal, setShowNewFileModal] = useState(false);
    const [newFileCategory, setNewFileCategory] = useState('characters'); // default
    const [newFileName, setNewFileName] = useState('');

    const fetchTree = useCallback(async () => {
        try {
            const res = await fetch(`/api/editor/files?projectId=${projectId}`);
            if (res.ok) {
                const data = await res.json();
                setFileTree(data);
            }
        } catch (e) {
            console.error(e);
        }
    }, [projectId]);

    useEffect(() => {
        fetchTree();
    }, [fetchTree]);

    const handleSelectFile = async (category: string, docId: string) => {
        if (activeFile?.category === category && activeFile?.docId === docId) return;

        setIsLoadingNode(true);
        setActiveFile({ category, docId });
        try {
            const res = await fetch(`/api/editor/document?projectId=${projectId}&category=${category}&docId=${docId}`);
            if (res.ok) {
                const data = await res.json();
                setContent(data.content);
            } else {
                setContent(''); // Maybe new file
            }
        } catch (e) {
            console.error(e);
            setContent('');
        } finally {
            setIsLoadingNode(false);
        }
    };

    const handleSave = async () => {
        if (!activeFile) return;
        setIsSaving(true);
        try {
            await fetch(`/api/editor/document`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    category: activeFile.category,
                    docId: activeFile.docId,
                    content
                })
            });
            // Refresh tree in case it's a new file
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
    }, [activeFile, content]);

    const handleCreateNewFile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFileName.trim()) return;

        const safeDocId = newFileName.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '-');

        setActiveFile({ category: newFileCategory, docId: safeDocId });
        setContent(`---\ntitle: "${newFileName}"\ndescription: ""\ntags: []\n---\n\nInitial log sequence...`);
        setShowNewFileModal(false);
        setNewFileName('');
    };

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)', width: '100vw', marginTop: 1, borderTop: '1px solid var(--border)' }}>

            {/* Sidebar */}
            <aside style={{ width: '280px', borderRight: '1px solid var(--border)', background: 'var(--background)', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>File Directory</h3>
                    <button
                        onClick={() => setShowNewFileModal(true)}
                        style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}
                    >
                        + NEW
                    </button>
                </div>

                {fileTree.map(node => (
                    <div key={node.category} style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--foreground)', textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '0.5rem', letterSpacing: '1px' }}>
                            /{node.category}
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {node.entries.length === 0 ? (
                                <li style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '1rem', fontStyle: 'italic' }}>empty node</li>
                            ) : null}
                            {node.entries.map(docId => {
                                const isActive = activeFile?.category === node.category && activeFile?.docId === docId.replace(/\.mdx?$/, '');
                                return (
                                    <li key={docId} style={{ paddingLeft: '0.5rem', marginBottom: '0.25rem' }}>
                                        <button
                                            onClick={() => handleSelectFile(node.category, docId.replace(/\.mdx?$/, ''))}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontFamily: 'monospace',
                                                fontSize: '0.85rem',
                                                padding: '0.4rem',
                                                width: '100%',
                                                borderRadius: '4px',
                                                backgroundColor: isActive ? 'rgba(182, 155, 116, 0.05)' : 'transparent',
                                                transition: 'all 0.2s ease',
                                                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent'
                                            }}
                                        >
                                            {docId}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </aside>

            {/* Main Editor Area */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--background)', position: 'relative' }}>
                {activeFile ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--accent)' }}>/</span>{activeFile.category}<span style={{ color: 'var(--accent)' }}>/</span>{activeFile.docId}.mdx
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
                                    <MDXRemoteClient {...mdxSource} components={{ Timeline }} />
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
                        <form onSubmit={handleCreateNewFile} style={{
                            background: 'var(--background)',
                            padding: '3rem',
                            border: '1px solid var(--accent)',
                            borderRadius: '2px',
                            width: '400px',
                            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8), 0 10px 30px rgba(0,0,0,0.5)'
                        }}>
                            <h2 style={{ marginTop: 0, marginBottom: '2rem', color: 'var(--accent)', fontFamily: 'var(--font-serif)' }}>INITIALIZE NEW SCROLL</h2>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>ROOT FOLDER</label>
                                <select
                                    value={newFileCategory}
                                    onChange={(e) => setNewFileCategory(e.target.value)}
                                    style={{
                                        width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.5)',
                                        border: '1px solid var(--border)', color: 'white', fontFamily: 'monospace',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="characters">/characters</option>
                                    <option value="factions">/factions</option>
                                    <option value="events">/events</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>SCROLL DESIGNATION</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newFileName}
                                    onChange={(e) => setNewFileName(e.target.value)}
                                    style={{
                                        width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.5)',
                                        border: '1px solid var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-mono)',
                                        outline: 'none'
                                    }}
                                    placeholder="e.g. Neo-Tokyo Protocol"
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowNewFileModal(false)} className="btn-auth btn-logout">[ ABORT ]</button>
                                <button type="submit" className="btn-auth" style={{ borderColor: 'var(--interactive)', color: 'var(--interactive)' }}>[ ENGRAVE ]</button>
                            </div>
                        </form>
                    </FadeIn>
                </div>
            )}
        </div>
    );
}
