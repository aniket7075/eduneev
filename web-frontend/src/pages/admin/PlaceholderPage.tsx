import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { Construction, ArrowLeft } from 'lucide-react';

interface Props {
  title: string;
}

const PlaceholderPage: React.FC<Props> = ({ title }) => {
  const navigate = useNavigate();
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'white', color: 'var(--text-main)', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }} title="Go Back"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="welcome-text">{title}</h1>
            <p className="date-text">Module under development</p>
          </div>
          </div>
        </header>

        <div className="glass-card flex-center" style={{ height: '60vh', flexDirection: 'column', gap: '1rem' }}>
          <Construction size={64} className="text-muted" />
          <h2 className="text-muted">This module is being built</h2>
          <p className="text-muted">Check back soon for the full web implementation of {title}.</p>
        </div>
      </main>
    </div>
  );
};

export default PlaceholderPage;
