import TopNav from '@/components/TopNav';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function GuidePage() {
    const session = await getServerSession(authOptions);

    return (
        <div className="min-h-screen flex flex-col noise-bg" style={{ backgroundColor: 'var(--background)' }}>
            <TopNav />

            <main className="flex-1 max-w-4xl mx-auto w-full p-8 md:p-12" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-serif)' }}>
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '2rem', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2.5rem', letterSpacing: '4px', color: 'var(--accent)', textTransform: 'uppercase', margin: 0 }}>
                        Archive Guide
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '1rem' }}>
                        Syntactic protocols for the Grand Codex.
                    </p>
                </div>

                <div className="space-y-12" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>

                    <section>
                        <h2 style={{ fontSize: '1.8rem', color: 'var(--interactive)', marginBottom: '1rem' }}>
                            1. The Virtual File System (VFS)
                        </h2>
                        <p style={{ marginBottom: '1rem' }}>
                            The engine utilizes a dynamic Virtual File System. When organizing your scrolls, use the interactive sidebar to create infinite directories and documents. Behind the scenes, the Storage Adapter parses these structures seamlessly depending on your configured environment (Local vs Cloud).
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.8rem', color: 'var(--interactive)', marginBottom: '1rem' }}>
                            2. Connecting Scrolls (MDX Linking)
                        </h2>
                        <p style={{ marginBottom: '1rem' }}>
                            To reference another entity within the codex, you must utilize precise directory paths. The editor intelligently intercepts relative markdown links that begin with a forward slash (<code style={{ background: '#0A0908', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>/</code>).
                        </p>

                        <div style={{ background: '#0A0908', border: '1px solid var(--border)', padding: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>// Goal: Link to a file named 'protagonist.mdx' inside the 'characters' directory.</p>
                            <p style={{ color: 'var(--accent)' }}>[The Outcast](/characters/protagonist)</p>
                        </div>

                        <div style={{ background: '#0A0908', border: '1px solid var(--border)', padding: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>// Goal: Link to a deeply nested lore entry.</p>
                            <p style={{ color: 'var(--accent)' }}>[Ancient Treaty](/history/age-of-strife/treaty-of-iron)</p>
                        </div>

                        <p style={{ color: 'var(--danger)', fontSize: '0.95rem', marginTop: '1rem' }}>
                            <strong>CRITICAL RULE:</strong> You do NOT need to include the `.mdx` or `.md` extension in the path URL. The router automatically resolves the virtual node.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.8rem', color: 'var(--interactive)', marginBottom: '1rem' }}>
                            3. The Interactive Timeline
                        </h2>
                        <p style={{ marginBottom: '1rem' }}>
                            As a native MDX engine, you possess the ability to summon React components directly within your text. The most vital component is the <code>&lt;Timeline&gt;</code>. Use it to forge chronological sequences of events.
                        </p>

                        <div style={{ background: '#0A0908', border: '1px solid var(--border)', padding: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>// Inject this block into any scroll to render a visual timeline.</p>
                            <pre style={{ margin: 0, color: 'var(--accent)', overflowX: 'auto' }}>
                                {`<Timeline 
  events={[
    { 
      date: "3045 AE", 
      title: "The Siege of Atoria", 
      description: "The capital fell after a 40-day blockade." 
    },
    { 
      date: "3046 AE", 
      title: "The Signing", 
      description: "The [Treaty of Iron](/history/treaty) was drafted." 
    }
  ]} 
/>`}
                            </pre>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}
