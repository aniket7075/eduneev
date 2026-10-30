import React from 'react';
import './BackgroundDecorations.css';

const BackgroundDecorations: React.FC = () => {
  return (
    <div className="bg-decorations-container">
      {/* Letter A Block */}
      <div className="decor decor-edu-1">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.4">
          <rect x="10" y="10" width="80" height="80" rx="10" fill="#0A66C2" fillOpacity="0.2" stroke="#0A66C2" strokeWidth="4" strokeOpacity="0.3"/>
          <text x="50" y="70" fontFamily="Fredoka, sans-serif" fontSize="50" fontWeight="bold" fill="#0A66C2" opacity="0.5" textAnchor="middle">A</text>
        </svg>
      </div>
      
      {/* Number 1 Block */}
      <div className="decor decor-edu-2">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.4">
          <rect x="10" y="10" width="80" height="80" rx="10" fill="#E81C2E" fillOpacity="0.2" stroke="#E81C2E" strokeWidth="4" strokeOpacity="0.3"/>
          <text x="50" y="70" fontFamily="Fredoka, sans-serif" fontSize="50" fontWeight="bold" fill="#E81C2E" opacity="0.5" textAnchor="middle">1</text>
        </svg>
      </div>

      {/* Pencil */}
      <div className="decor decor-edu-3">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.4">
          <g transform="rotate(45 50 50)">
            <rect x="30" y="20" width="20" height="60" fill="#F5B000" fillOpacity="0.3" stroke="#F5B000" strokeWidth="3" strokeOpacity="0.5"/>
            <path d="M30 80 L50 80 L40 95 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2"/>
            <path d="M38 92 L42 92 L40 95 Z" fill="#334155"/>
            <rect x="30" y="10" width="20" height="10" fill="#FDA4AF" fillOpacity="0.5" stroke="#FDA4AF" strokeWidth="2"/>
          </g>
        </svg>
      </div>

      {/* Graduation Cap */}
      <div className="decor decor-edu-4">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.3">
          <path d="M50 20 L10 40 L50 60 L90 40 Z" fill="#08529B" stroke="#08529B" strokeWidth="4"/>
          <rect x="35" y="50" width="30" height="20" fill="#08529B"/>
          <path d="M85 45 L85 70" stroke="#F5B000" strokeWidth="4"/>
          <circle cx="85" cy="70" r="5" fill="#F5B000"/>
        </svg>
      </div>

      {/* Floating Shapes */}
      <div className="decor decor-shape-1">
        <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.3">
          <circle cx="25" cy="25" r="20" stroke="#34D399" strokeWidth="5" strokeDasharray="10 5"/>
        </svg>
      </div>

      <div className="decor decor-shape-2">
        <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.3">
          <polygon points="25,5 45,40 5,40" stroke="#E81C2E" strokeWidth="5" strokeLinejoin="round"/>
        </svg>
      </div>

    </div>
  );
};

export default BackgroundDecorations;
