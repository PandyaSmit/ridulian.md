import Link from 'next/link';
import { StaggerContainer, StaggerItem, FadeIn } from '@/components/MotionWrapper';

export default function Home() {
  return (
    <div className="app-container">
      <nav className="top-nav">
        <Link href="/" className="nav-brand">ridulian.md</Link>
        <div className="nav-links">
          <Link href="/graph">Universe Graph</Link>
        </div>
      </nav>
      <main className="main-content">
        <StaggerContainer className="hero-section">
          <StaggerItem>
            <h1 className="hero-title">Map Expanding Universes</h1>
          </StaggerItem>
          <StaggerItem>
            <p className="hero-subtitle">
              A specialized engine for managing massive fictional universes, timelines, and character relationship webs using simple Markdown files.
            </p>
          </StaggerItem>
          <StaggerItem>
            <div className="hero-actions">
              <a href="/graph" className="btn-primary">Explore the Graph</a>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </main>
    </div>
  );
}
