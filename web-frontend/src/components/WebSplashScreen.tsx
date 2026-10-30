import React, { useEffect, useState } from 'react';
import './WebSplashScreen.css';

interface WebSplashScreenProps {
  onComplete: () => void;
}

const CLIENT_NAMES = [
  'Chinchwad Branch',
  'Chikhali Branch',
  'Dudulgaon Branch',
  'Wakad Branch',
  'Pimpri Branch',
  'Nigdi Branch',
];

const WebSplashScreen: React.FC<WebSplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [activeClient, setActiveClient] = useState(0);

  // Cycle through client names every 600ms
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveClient(prev => (prev + 1) % CLIENT_NAMES.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`web-splash-container ${!isVisible ? 'fade-out' : ''}`}>
      {/* Background cute blobs — ORIGINAL */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <div className="splash-content">
        <div className="logo-container">
          <img
            src="/logopre.png"
            alt="EduNeev Kids Preschool Logo"
            className="splash-logo bounce-in"
          />
          <h1 className="splash-brand text-gradient slide-up">
            EDUNEEV KIDS PRESCHOOL
          </h1>
          <p className="splash-subtitle slide-up">
            A Foundation for the future... Since 2013
          </p>

          {/* ── Client Names ── */}
          <div className="client-names-wrap slide-up">
            <p className="client-names-label">Proudly Serving</p>
            <div className="client-chips">
              {CLIENT_NAMES.map((name, idx) => (
                <span
                  key={idx}
                  className={`client-chip ${activeClient === idx ? 'chip-active' : ''}`}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Peeking Animals — ORIGINAL */}
      {/* Bottom Right: Cat */}
      <div className="peek-animal peek-cat">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="120" r="60" fill="#FDBA74" />
          <path d="M50 80 L 40 20 L 90 65 Z" fill="#F97316" />
          <path d="M150 80 L 160 20 L 110 65 Z" fill="#F97316" />
          <circle cx="75" cy="110" r="8" fill="#1E293B" />
          <circle cx="125" cy="110" r="8" fill="#1E293B" />
          <circle cx="60" cy="125" r="10" fill="#FDA4AF" opacity="0.6" />
          <circle cx="140" cy="125" r="10" fill="#FDA4AF" opacity="0.6" />
          <polygon points="95,125 105,125 100,132" fill="#F43F5E" />
          <path d="M90 135 Q 100 145 100 135 Q 100 145 110 135" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
          <line x1="20" y1="115" x2="50" y2="120" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="130" x2="48" y2="130" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
          <line x1="180" y1="115" x2="150" y2="120" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
          <line x1="185" y1="130" x2="152" y2="130" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
          <circle cx="50" cy="60" r="15" fill="#F97316" />
          <circle cx="150" cy="60" r="15" fill="#F97316" />
        </svg>
      </div>

      {/* Bottom Left: Giraffe */}
      <div className="peek-animal peek-giraffe">
        <svg viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M70 300 L 80 100 L 120 100 L 130 300 Z" fill="#FCD34D" />
          <circle cx="95" cy="150" r="12" fill="#B45309" />
          <circle cx="110" cy="200" r="15" fill="#B45309" />
          <circle cx="85" cy="250" r="10" fill="#B45309" />
          <ellipse cx="100" cy="80" rx="40" ry="30" fill="#FCD34D" />
          <ellipse cx="100" cy="65" rx="30" ry="20" fill="#FDE68A" />
          <circle cx="85" cy="75" r="5" fill="#1E293B" />
          <circle cx="115" cy="75" r="5" fill="#1E293B" />
          <line x1="85" y1="55" x2="80" y2="25" stroke="#FCD34D" strokeWidth="6" strokeLinecap="round" />
          <circle cx="80" cy="25" r="6" fill="#B45309" />
          <line x1="115" y1="55" x2="120" y2="25" stroke="#FCD34D" strokeWidth="6" strokeLinecap="round" />
          <circle cx="120" cy="25" r="6" fill="#B45309" />
          <ellipse cx="50" cy="80" rx="15" ry="8" transform="rotate(-15 50 80)" fill="#FCD34D" />
          <ellipse cx="150" cy="80" rx="15" ry="8" transform="rotate(15 150 80)" fill="#FCD34D" />
        </svg>
      </div>

      {/* Top Center: Monkey */}
      <div className="peek-animal peek-monkey">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 0 L 70 80" stroke="#78350F" strokeWidth="15" strokeLinecap="round" />
          <path d="M150 0 L 130 80" stroke="#78350F" strokeWidth="15" strokeLinecap="round" />
          <circle cx="100" cy="120" r="50" fill="#78350F" />
          <ellipse cx="100" cy="130" rx="40" ry="30" fill="#FDE68A" />
          <circle cx="40" cy="100" r="20" fill="#78350F" />
          <circle cx="40" cy="100" r="10" fill="#FDE68A" />
          <circle cx="160" cy="100" r="20" fill="#78350F" />
          <circle cx="160" cy="100" r="10" fill="#FDE68A" />
          <circle cx="85" cy="110" r="8" fill="#1E293B" />
          <circle cx="115" cy="110" r="8" fill="#1E293B" />
          <ellipse cx="100" cy="125" rx="5" ry="3" fill="#1E293B" />
          <path d="M90 140 Q 100 150 110 140" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* Right Side: Peekaboo Dog */}
      <div className="peek-animal peek-dog">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="60" fill="#E2E8F0" />
          <circle cx="120" cy="70" r="25" fill="#94A3B8" />
          <path d="M50 70 Q 20 120 40 150 Q 60 120 70 80" fill="#E2E8F0" />
          <path d="M150 70 Q 180 120 160 150 Q 140 120 130 80" fill="#94A3B8" />
          <circle cx="75" cy="90" r="6" fill="#1E293B" />
          <circle cx="125" cy="90" r="6" fill="#1E293B" />
          <circle cx="100" cy="105" r="10" fill="#0F172A" />
          <path d="M100 115 L 100 125" stroke="#0F172A" strokeWidth="2" />
          <path d="M90 125 Q 100 135 110 125" stroke="#0F172A" strokeWidth="2" fill="none" />
          <path d="M95 125 Q 100 145 105 125" fill="#FDA4AF" />
        </svg>
      </div>
    </div>
  );
};

export default WebSplashScreen;
