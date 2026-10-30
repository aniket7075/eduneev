import React from 'react';
import { useLanguage } from '../utils/LanguageContext';
import type { Language } from '../utils/translations';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  compact?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const { language, setLanguage } = useLanguage();

  const options: Array<{ code: Language; label: string; flag: string }> = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  ];

  return (
    <div 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: compact ? 'auto' : '42px',
        gap: '0.4rem',
        background: compact ? 'transparent' : '#FFFFFF',
        padding: compact ? '0.2rem 0.4rem' : '0 0.85rem',
        borderRadius: compact ? '0.5rem' : '0.85rem',
        border: compact ? 'none' : '1px solid #CBD5E1',
        boxShadow: compact ? 'none' : '0 2px 6px rgba(0,0,0,0.02)',
        boxSizing: 'border-box',
      }}
    >
      <Globe size={compact ? 16 : 18} color="#4F46E5" style={{ flexShrink: 0 }} />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        style={{
          border: 'none',
          background: 'transparent',
          fontWeight: 800,
          fontSize: compact ? '0.8rem' : '0.85rem',
          color: '#0F172A',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.flag} {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
