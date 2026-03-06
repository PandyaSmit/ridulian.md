import { getGraphData } from '@/lib/markdown';
import GraphView from '@/components/GraphView';
import Link from 'next/link';

export default async function GraphPage() {
    const data = await getGraphData();

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <nav className="top-nav" style={{ position: 'absolute', top: 0, left: 0, width: '100%', background: 'transparent', borderBottom: 'none', zIndex: 100 }}>
                <Link href="/" className="nav-brand">ridulian.md</Link>
                <div className="nav-links">
                    <Link href="/">Back to Home</Link>
                </div>
            </nav>
            <GraphView initialData={data} />
        </div>
    );
}
