"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FadeIn, StaggerContainer, StaggerItem } from './MotionWrapper';
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
        <div className="project-dashboard">
            <div className="dashboard-header" style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>Active Terminals</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Select a universe designation to commence localized connection.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                <StaggerContainer className="project-grid">
                    {/* The "Create New" Tile */}
                    <StaggerItem>
                        <div
                            className="project-card create-new-card"
                            onClick={() => setIsModalOpen(true)}
                            style={{
                                padding: '2rem',
                                background: 'transparent',
                                border: '1px dashed var(--accent)',
                                borderRadius: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '160px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <span style={{ fontSize: '2rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>+</span>
                            <span style={{ color: 'var(--accent)', letterSpacing: '1px', fontSize: '0.9rem', fontWeight: 'bold' }}>[ INITIATE NEW PROJECT ]</span>
                        </div>
                    </StaggerItem>

                    {/* Existing Project Tiles */}
                    {activeProjects.map((proj) => (
                        <StaggerItem key={proj.id}>
                            <div style={{ position: 'relative' }}>
                                <Link href={`/editor/${proj.id}`} style={{ textDecoration: 'none' }}>
                                    <div className="project-card existing-card" style={{
                                        padding: '2rem',
                                        background: 'rgba(0, 255, 204, 0.02)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        minHeight: '160px',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        {/* Subtle scanline overlay specific to the card */}
                                        <div className="card-scanline-overlay"></div>

                                        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--foreground)', fontSize: '1.4rem' }}>{proj.name}</h3>

                                        <div style={{ marginTop: 'auto' }}>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                ACCESS ID: <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{proj.id.split('-')[0]}</span>
                                            </p>
                                            {proj.updatedAt && (
                                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    LAST SYNC: {new Date(proj.updatedAt).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>

                                {/* Archive Button overlay */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setProjectToArchive(proj);
                                    }}
                                    className="archive-btn"
                                    style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        background: 'rgba(255, 51, 102, 0.1)',
                                        border: '1px solid rgba(255, 51, 102, 0.3)',
                                        color: '#ff3366',
                                        cursor: 'pointer',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        fontFamily: 'monospace',
                                        zIndex: 10,
                                        opacity: 0.6,
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    [ ARCHIVE ]
                                </button>
                            </div>
                        </StaggerItem>
                    ))}
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
                            <h2 style={{ marginTop: 0, marginBottom: '2rem', color: 'var(--accent)' }}>SYSTEM PARAMETERS</h2>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>DESIGNATION (PROJECT NAME)</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    disabled={isCreating}
                                    style={{
                                        width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.5)',
                                        border: '1px solid var(--border)', color: 'white', fontFamily: 'monospace',
                                        outline: 'none'
                                    }}
                                    placeholder="e.g. The Sprawl"
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-auth btn-logout" disabled={isCreating}>[ ABORT ]</button>
                                <button type="submit" className="btn-auth btn-login" disabled={isCreating}>
                                    {isCreating ? '[ EXECUTING... ]' : '[ CONFIRM ]'}
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
                            <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#ff3366', letterSpacing: '2px' }}>WARNING: SEVER CONNECTION</h2>

                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
                                Archiving <strong style={{ color: 'white' }}>{projectToArchive.name}</strong> will remove it from your active terminal grid. No data will be physically destroyed, but the uplink will be hidden.
                            </p>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setProjectToArchive(null)}
                                    className="btn-auth"
                                    style={{ borderColor: 'var(--border)' }}
                                    disabled={isArchiving}
                                >
                                    [ CANCEL ]
                                </button>
                                <button
                                    onClick={handleArchiveProject}
                                    className="btn-auth btn-logout"
                                    disabled={isArchiving}
                                >
                                    {isArchiving ? '[ SEVERING... ]' : '[ SEVER CONNECTION ]'}
                                </button>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            )}
        </div>
    );
}
