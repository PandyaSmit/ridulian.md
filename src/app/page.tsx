import { StaggerContainer, StaggerItem, FadeIn } from '@/components/MotionWrapper';
import TopNav from '@/components/TopNav';
import HeroButton from '@/components/HeroButton';

export default function Home() {
  return (
    <div className="app-container">
      <TopNav />
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
          <div className="hero-actions">
            <HeroButton />
          </div>
        </StaggerContainer>
      </main>
    </div>
  );
}
