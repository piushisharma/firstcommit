import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MenuBar from './components/MenuBar.jsx';
import Footer from './components/Footer.jsx';
import Skeleton from './components/Skeleton.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
const Explain = lazy(() => import('./pages/Explain.jsx'));
const Explorer = lazy(() => import('./pages/Explorer.jsx'));
const Issues = lazy(() => import('./pages/Issues.jsx'));
const Setup = lazy(() => import('./pages/Setup.jsx'));
const Roadmap = lazy(() => import('./pages/Roadmap.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function PageFallback() {
  return (
    <div style={{ padding: '40px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      <Skeleton width="600px" height="300px" />
      <Skeleton width="360px" height="300px" />
    </div>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <MenuBar />
      <main className="desktop-canvas">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explain/:owner/:repo" element={<Explain />} />
            <Route path="/explore/:owner/:repo" element={<Explorer />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/setup/:owner/:repo" element={<Setup />} />
            <Route path="/roadmap/:id" element={<Roadmap />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
