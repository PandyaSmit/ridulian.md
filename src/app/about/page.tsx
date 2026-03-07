import TopNav from '@/components/TopNav';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AboutPage() {
    const session = await getServerSession(authOptions);

    return (
        <div className="min-h-screen flex flex-col noise-bg" style={{ backgroundColor: 'var(--background)' }}>
            <TopNav />

            <main className="flex-1 max-w-4xl mx-auto w-full p-8 md:p-12" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-serif)' }}>
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '2rem', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2.5rem', letterSpacing: '4px', color: 'var(--accent)', textTransform: 'uppercase', margin: 0 }}>
                        The Architect
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '1rem' }}>
                        Designing the infrastructure of universes.
                    </p>
                </div>

                <div className="space-y-8" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                    <section>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--interactive)', marginBottom: '1rem', borderBottom: '1px dashed var(--border)', paddingBottom: '0.5rem' }}>
                            Origins
                        </h2>
                        <p>
                            The ridulian.md project was forged from the necessity to establish order amid the chaos of creative expansion. Too often, the architect of a world finds themselves lost within their own creation—scrolling through endless, disjointed text files, losing track of timelines, and forgetting the delicate threads that connect a protagonist to their destiny.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--interactive)', marginBottom: '1rem', borderBottom: '1px dashed var(--border)', paddingBottom: '0.5rem' }}>
                            The Imperial Archive
                        </h2>
                        <p>
                            This engine is designed to be more than a mere text editor; it is a repository for truth. The aesthetic—obsidian stone, illuminated parchment, and tarnished gold—is deliberately chosen to evoke the solemnity of recording immutable history. When you write here, you are not drafting; you are etching reality into the Grand Codex.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--interactive)', marginBottom: '1rem', borderBottom: '1px dashed var(--border)', paddingBottom: '0.5rem' }}>
                            Open-Core Philosophy
                        </h2>
                        <p>
                            Knowledge must be preserved, and the tools to record it must remain accessible. ridulian.md operates on an Open-Core architecture. The Virtual File System (VFS) and the Dual-Mode Storage Adapter ensure that your data can remain entirely local, etched upon your own hardware, or distributed securely to the cloud when the time comes to share the codex with other scholars.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--interactive)', marginBottom: '1rem', borderBottom: '1px dashed var(--border)', paddingBottom: '0.5rem' }}>
                            Hail The Architect
                        </h2>
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>
                            <a href="mailto:smitpandya1099@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">
                                <span style={{ color: 'var(--text-muted)' }}>[</span> EMAIL <span style={{ color: 'var(--text-muted)' }}>]</span>
                            </a>
                            <a href="https://github.com/PandyaSmit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">
                                <span style={{ color: 'var(--text-muted)' }}>[</span> GITHUB <span style={{ color: 'var(--text-muted)' }}>]</span>
                            </a>
                            <a href="https://www.smitpandya.in/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">
                                <span style={{ color: 'var(--text-muted)' }}>[</span> SMIT-PANDYA <span style={{ color: 'var(--text-muted)' }}>]</span>
                            </a>
                        </div>
                    </section>
                </div>

                <div style={{ marginTop: '4rem', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '2rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                    <p>ridulian.md Engine v0.1.0</p>
                </div>
            </main>
        </div>
    );
}
