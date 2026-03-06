"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FadeIn, StaggerContainer, StaggerItem } from './MotionWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, Feather, Book, Flame } from 'lucide-react';
import type { ProjectDef } from '@/lib/StorageManager';

export default function ProjectList({ initialProjects }: { initialProjects: ProjectDef[] }) {
    const [projects, setProjects] = useState<ProjectDef[]>(initialProjects);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Archive State
    const [projectToArchive, setProjectToArchive] = useState<ProjectDef | null>(null);
    const [isArchiving, setIsArchiving] = useState(false);

    const router = useRouter();

    // Filter to only show active projects
    const activeProjects = projects.filter(p => !p.status || p.status === 'active');

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        setIsCreating(true);
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectName: newProjectName.trim() })
            });

            if (!res.ok) throw new Error('Failed to create project');

            const newProj = await res.json();

            // Update local state and route to the new editor
            const now = new Date().toISOString();
            setProjects([...projects, { id: newProj.projectId, name: newProj.name, createdAt: now, updatedAt: now }]);
            setIsModalOpen(false);
            setNewProjectName('');

            // Navigate to the editor for this new project
            router.push(`/editor/${newProj.projectId}`);
        } catch (error) {
            console.error(error);
            setIsCreating(false);
        }
    };

    const handleArchiveProject = async () => {
        if (!projectToArchive) return;
        setIsArchiving(true);
        try {
            const res = await fetch('/api/projects/archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: projectToArchive.id })
            });

            if (!res.ok) throw new Error('Failed to archive project');

            // Optimistic deletion
            setProjects(projects.map(p =>
                p.id === projectToArchive.id ? { ...p, status: 'deleted' } : p
            ));

            setProjectToArchive(null);
        } catch (error) {
            console.error(error);
        } finally {
            setIsArchiving(false);
        }
    };

    return (
        <div className="project-dashboard" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 0' }}>
            <div className="dashboard-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <Library size={48} color="var(--accent)" style={{ marginBottom: '1.5rem', opacity: 0.8, display: 'inline-block' }} />
                <h1 style={{
                    fontSize: 'max(3rem, 4vw)',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--accent)',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '1.5rem',
                    display: 'inline-block'
                }}>
                    The Grand Codex
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '2rem', fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontStyle: 'italic' }}>
                    "Knowledge is the only wealth that cannot be plundered."
                </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4rem' }}>
                <button
                    onClick={() => setIsModalOpen(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                        background: 'transparent',
                        border: '1px solid var(--accent)',
                        color: 'var(--accent)',
                        padding: '1rem 2rem',
                        fontSize: '1.1rem',
                        fontFamily: 'var(--font-serif)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: 'inset 0 0 0 rgba(182, 155, 116, 0)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(182, 155, 116, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'inset 0 0 0 rgba(182, 155, 116, 0)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    <Feather size={20} />
                    Inscribe New Tome
                </button>
            </div>

            <div className="tome-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <StaggerContainer>
                    <AnimatePresence>
                        {activeProjects.map((proj) => (
                            <StaggerItem key={proj.id}>
                                <motion.div
                                    exit={{ opacity: 0, x: -20, transition: { duration: 0.4, ease: 'easeInOut' } }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '2rem 3rem',
                                        background: 'rgba(22, 20, 18, 0.6)',
                                        borderTop: '1px solid var(--border)',
                                        borderBottom: '1px solid var(--border)',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(22, 20, 18, 0.9)';
                                        e.currentTarget.style.borderColor = 'var(--interactive)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(22, 20, 18, 0.6)';
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                        <Book size={36} color="var(--accent)" style={{ opacity: 0.7 }} />
                                        <div>
                                            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--foreground)', fontSize: '1.8rem', fontFamily: 'var(--font-serif)', letterSpacing: '0.05em' }}>
                                                {proj.name}
                                            </h3>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                                SIGIL: <span style={{ color: 'var(--accent)' }}>{proj.id.split('-')[0]}</span>
                                                <span style={{ margin: '0 1rem', opacity: 0.5 }}>✧</span>
                                                LAST SYNC: {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                        <Link
                                            href={`/editor/${proj.id}`}
                                            style={{
                                                textDecoration: 'none',
                                                color: 'var(--interactive)',
                                                fontFamily: 'var(--font-serif)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                fontSize: '1rem',
                                                borderBottom: '1px solid transparent',
                                                transition: 'all 0.2s ease',
                                                paddingBottom: '2px'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderBottom = '1px solid var(--interactive)'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderBottom = '1px solid transparent'}
                                        >
                                            Unfurl Scroll
                                        </Link>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setProjectToArchive(proj);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--danger)',
                                                cursor: 'pointer',
                                                fontFamily: 'var(--font-serif)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                fontSize: '0.9rem',
                                                opacity: 0.7,
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                                        >
                                            <Flame size={16} /> Seal
                                        </button>
                                    </div>
                                </motion.div>
                            </StaggerItem>
                        ))}
                    </AnimatePresence>
                </StaggerContainer>
            </div>

            {/* Basic Cyberpunk Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <FadeIn>
                        <form onSubmit={handleCreateProject} style={{
                            background: 'var(--background)',
                            padding: '3rem',
                            border: '1px solid var(--accent)',
                            borderRadius: '8px',
                            width: '400px',
                            boxShadow: '0 0 40px rgba(0, 255, 204, 0.1)'
                        }}>
                            <h2 style={{ marginTop: 0, marginBottom: '2rem', color: 'var(--accent)', fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tome Inscription</h2>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontFamily: 'var(--font-serif)', textTransform: 'uppercase' }}>Tome Designation (Title)</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    disabled={isCreating}
                                    style={{
                                        width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.5)',
                                        border: '1px solid var(--border)', color: 'white', fontFamily: 'var(--font-mono)',
                                        outline: 'none',
                                        fontSize: '1.1rem'
                                    }}
                                    placeholder="e.g. The Sprawl"
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }} disabled={isCreating}>Abort</button>
                                <button type="submit" style={{ background: 'var(--accent)', color: 'var(--background)', border: 'none', padding: '0.5rem 1.5rem', cursor: 'pointer', fontFamily: 'var(--font-serif)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }} disabled={isCreating}>
                                    {isCreating ? 'Inscribing...' : 'Inscribe'}
                                </button>
                            </div>
                        </form>
                    </FadeIn>
                </div>
            )}

            {/* Archive Confirmation Modal */}
            {projectToArchive && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <FadeIn>
                        <div style={{
                            background: '#0a0a0a',
                            padding: '3rem',
                            border: '1px solid #ff3366',
                            borderRadius: '8px',
                            width: '450px',
                            boxShadow: '0 0 40px rgba(255, 51, 102, 0.15)',
                            textAlign: 'center'
                        }}>
                            <h2 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--danger)', letterSpacing: '0.1em', fontFamily: 'var(--font-serif)' }}>WARNING: SEAL ARCHIVE</h2>

                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6', fontSize: '1.1rem' }}>
                                Sealing <strong style={{ color: 'var(--foreground)' }}>{projectToArchive.name}</strong> will remove it from your active codex. No inscriptions will be physically destroyed, but the tome will be obscured from view.
                            </p>

                            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setProjectToArchive(null)}
                                    style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '0.5rem 1.5rem', cursor: 'pointer', fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                    disabled={isArchiving}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleArchiveProject}
                                    style={{ background: 'var(--danger)', border: 'none', color: 'white', padding: '0.5rem 1.5rem', cursor: 'pointer', fontFamily: 'var(--font-serif)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}
                                    disabled={isArchiving}
                                >
                                    {isArchiving ? 'Sealing...' : 'Seal Archive'}
                                </button>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            )}
        </div>
    );
}
