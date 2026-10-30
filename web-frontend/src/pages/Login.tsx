import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [shakeError, setShakeError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState('Welcome to');
  const [isNight, setIsNight] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning,');
    else if (hour < 18) setGreeting('Good Afternoon,');
    else setGreeting('Good Evening,');

    if (hour < 6 || hour >= 18) setIsNight(true);
  }, []);

  const triggerError = (msg: any) => {
    let safeMsg = 'An unexpected error occurred. Please try again.';
    if (typeof msg === 'string') {
      safeMsg = msg;
    } else if (msg && typeof msg.message === 'string') {
      safeMsg = msg.message;
    } else if (msg && typeof msg.error === 'string') {
      safeMsg = msg.error;
    }
    setError(safeMsg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.includes('@') || !email.includes('.')) {
      triggerError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      triggerError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const response = await apiClient.post('/auth/login', { email, password });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
      confetti({ particleCount: 100, spread: 80, origin: { x: 0.2, y: 0.6 }, colors, angle: 60 });
      confetti({ particleCount: 100, spread: 80, origin: { x: 0.8, y: 0.6 }, colors, angle: 120 });
      confetti({ particleCount: 150, spread: 120, origin: { y: 0.4 }, colors });

      setTimeout(() => {
        const role = (user?.role || '').toLowerCase();
        if (role === 'parent') {
          navigate('/parent/dashboard');
        } else if (role === 'teacher') {
          navigate('/teacher/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      }, 1500);
    } catch (err: any) {
      const errData = err.response?.data;
      let errMsg = 'Invalid email or password. Please try again.';
      if (typeof errData?.error === 'string') {
        errMsg = errData.error;
      } else if (errData?.error && typeof errData.error.message === 'string') {
        errMsg = errData.error.message;
      } else if (typeof errData?.message === 'string') {
        errMsg = errData.message;
      } else if (err.message && typeof err.message === 'string') {
        errMsg = err.message;
      }
      triggerError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`sky-layout ${isNight ? 'night-mode' : ''}`}>
      {/* CSS Clouds */}
      <div className="cloud cloud-1"></div>
      <div className="cloud cloud-2"></div>
      <div className="cloud cloud-3"></div>
      <div className="cloud cloud-4"></div>

      {/* Background Scenery: Vines, Tree, Grass */}
      <div className="scenery-vines-top">
        <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1000 100">
           <path d="M0,0 Q50,80 100,0 Q150,100 200,0 Q250,70 300,0 Q350,90 400,0 Q450,50 500,0 Q550,100 600,0 Q650,80 700,0 Q750,120 800,0 Q850,70 900,0 Q950,90 1000,0 L1000,0 L0,0 Z" fill="#22C55E" opacity="0.8" />
           <path d="M0,0 Q50,60 100,0 Q150,80 200,0 Q250,50 300,0 Q350,70 400,0 Q450,40 500,0 Q550,80 600,0 Q650,60 700,0 Q750,100 800,0 Q850,50 900,0 Q950,70 1000,0 L1000,0 L0,0 Z" fill="#16A34A" />
        </svg>
      </div>

      <div className="scenery-vines-left">
        <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 1000">
           <path d="M10,0 Q50,200 20,400 T30,800" stroke="#16A34A" strokeWidth="8" fill="none" />
           <path d="M20,100 Q40,120 20,140 Z" fill="#22C55E" />
           <path d="M30,250 Q50,270 30,290 Z" fill="#22C55E" />
           <path d="M25,500 Q45,520 25,540 Z" fill="#22C55E" />
           <path d="M20,700 Q40,720 20,740 Z" fill="#22C55E" />
           <path d="M30,0 Q80,150 50,300 T40,700" stroke="#15803D" strokeWidth="5" fill="none" />
           <path d="M50,80 Q70,100 50,120 Z" fill="#16A34A" />
           <path d="M60,200 Q80,220 60,240 Z" fill="#16A34A" />
           <path d="M45,400 Q65,420 45,440 Z" fill="#16A34A" />
           <path d="M45,600 Q65,620 45,640 Z" fill="#16A34A" />
        </svg>
      </div>

      <div className="scenery-tree-right">
        <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 1000">
          <path d="M60,0 Q20,300 40,600 Q20,800 0,1000 L100,1000 L100,0 Z" fill="#78350F" />
          <path d="M40,300 Q-20,250 -40,200" stroke="#78350F" strokeWidth="15" strokeLinecap="round" fill="none" />
          <path d="M50,600 Q-10,550 -30,500" stroke="#78350F" strokeWidth="20" strokeLinecap="round" fill="none" />
          <path d="M70,50 Q40,300 55,600" stroke="#451A03" strokeWidth="2" fill="none" opacity="0.5" />
          <path d="M85,150 Q60,400 70,700" stroke="#451A03" strokeWidth="2" fill="none" opacity="0.5" />
        </svg>
      </div>

      <div className="scenery-grass">
        <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1000 100">
          <path d="M0,100 Q150,20 300,100 Q500,-20 700,100 Q850,30 1000,100 L1000,100 L0,100 Z" fill="#4ADE80" opacity="0.9" />
          <path d="M0,100 Q200,40 450,100 Q750,0 1000,100 L1000,100 L0,100 Z" fill="#22C55E" />
        </svg>
      </div>

      {/* Decorative Book Stack on Bottom Left */}
      <div className="scenery-books-stack">
        <div className="book-item b-blue">Learn</div>
        <div className="book-item b-pink">Play</div>
        <div className="book-item b-orange">Explore</div>
        <div className="book-item b-green">Grow</div>
      </div>

      {/* Decorative Directional Signpost on Bottom Right */}
      <div className="scenery-signpost">
        <div className="sign-post-pole"></div>
        <div className="sign-arrow sign-yellow">Learn</div>
        <div className="sign-arrow sign-pink">Play</div>
        <div className="sign-arrow sign-blue">Grow</div>
        <div className="sign-arrow sign-green">Together</div>
      </div>

      {/* Walking Pets on the Grass */}
      <div className="walking-pet pet-bunny">
        <svg viewBox="0 0 100 100" width="70" height="70" className="hopping-bunny">
           <ellipse cx="50" cy="20" rx="6" ry="18" fill="#E2E8F0" transform="rotate(-15 50 20)" />
           <ellipse cx="65" cy="25" rx="6" ry="18" fill="#F1F5F9" transform="rotate(15 65 25)" />
           <ellipse cx="65" cy="25" rx="3" ry="12" fill="#FDA4AF" transform="rotate(15 65 25)" />
           <circle cx="20" cy="65" r="10" fill="#FFFFFF" />
           <ellipse cx="50" cy="65" rx="30" ry="22" fill="#F1F5F9" />
           <circle cx="70" cy="50" r="18" fill="#F1F5F9" />
           <circle cx="75" cy="45" r="3" fill="#1E293B" className="open-eye" />
           <circle cx="86" cy="52" r="3" fill="#FDA4AF" />
           <ellipse cx="40" cy="85" rx="7" ry="4" fill="#CBD5E1" />
           <ellipse cx="70" cy="85" rx="7" ry="4" fill="#CBD5E1" />
        </svg>
      </div>

      <div className="walking-pet pet-turtle">
        <svg viewBox="0 0 100 100" width="50" height="50">
           <rect x="25" y="65" width="12" height="18" rx="6" fill="#22C55E" className="turtle-leg-1" />
           <rect x="60" y="65" width="12" height="18" rx="6" fill="#22C55E" className="turtle-leg-2" />
           <path d="M 15 70 Q 50 10 85 70 Z" fill="#15803D" />
           <path d="M 25 70 Q 50 30 75 70 Z" fill="#16A34A" />
           <circle cx="85" cy="60" r="14" fill="#4ADE80" />
           <circle cx="90" cy="55" r="2.5" fill="#1E293B" className="open-eye" />
        </svg>
      </div>

      <div className="walking-pet pet-chick">
        <svg viewBox="0 0 100 100" width="40" height="40" className="hopping-chick">
           <circle cx="50" cy="50" r="25" fill="#FDE047" />
           <circle cx="65" cy="35" r="18" fill="#FDE047" />
           <circle cx="70" cy="30" r="3" fill="#1E293B" className="open-eye" />
           <path d="M 80 35 L 95 35 L 80 42 Z" fill="#F97316" />
           <path d="M 30 45 Q 20 60 40 65 Z" fill="#FACC15" />
           <line x1="45" y1="75" x2="45" y2="90" stroke="#F97316" strokeWidth="4" strokeLinecap="round" />
           <line x1="45" y1="90" x2="55" y2="95" stroke="#F97316" strokeWidth="4" strokeLinecap="round" />
           <line x1="60" y1="75" x2="60" y2="90" stroke="#F97316" strokeWidth="4" strokeLinecap="round" />
           <line x1="60" y1="90" x2="70" y2="95" stroke="#F97316" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>

      {/* Peeking Animals (Screen edges) */}
      <div className={`peek-animal peek-koala ${isPasswordFocused && !showPassword ? 'covering-eyes' : ''}`}>
        <div className="animal-breathe">
          <svg viewBox="0 0 250 200" fill="none">
            <path d="M-20 160 Q 100 160 200 130 L 190 150 Q 100 180 -20 180 Z" fill="#78350F" />
            <path d="M30 165 Q 40 130 60 145 Z" fill="#4ADE80" />
            <path d="M100 155 Q 120 120 140 140 Z" fill="#22C55E" />
            <path d="M150 165 Q 170 190 140 190 Z" fill="#4ADE80" />
            <circle cx="80" cy="80" r="25" fill="#94A3B8" />
            <circle cx="80" cy="80" r="12" fill="#F1F5F9" />
            <circle cx="160" cy="70" r="25" fill="#94A3B8" />
            <circle cx="160" cy="70" r="12" fill="#F1F5F9" />
            <circle cx="120" cy="100" r="45" fill="#CBD5E1" />
            <ellipse cx="120" cy="115" rx="12" ry="18" fill="#1E293B" />
            <circle cx="95" cy="95" r="5" fill="#1E293B" className="open-eye" />
            <circle cx="145" cy="95" r="5" fill="#1E293B" className="open-eye" />
            <path d="M90 95 Q95 100 100 95" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" className="closed-eye" />
            <path d="M140 95 Q145 100 150 95" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" className="closed-eye" />
            <circle cx="90" cy="120" r="8" fill="#FDA4AF" opacity="0.5" />
            <circle cx="150" cy="120" r="8" fill="#FDA4AF" opacity="0.5" />
          </svg>
        </div>
      </div>

      <div className={`peek-animal peek-cat ${isPasswordFocused && !showPassword ? 'covering-eyes' : ''}`}>
        <div className="animal-breathe">
          <svg viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="120" r="60" fill="#FDBA74" />
            <path d="M50 80 L 40 20 L 90 65 Z" fill="#F97316" />
            <path d="M150 80 L 160 20 L 110 65 Z" fill="#F97316" />
            <circle cx="75" cy="110" r="8" fill="#1E293B" className="open-eye" />
            <circle cx="125" cy="110" r="8" fill="#1E293B" className="open-eye" />
            <path d="M65 110 Q75 120 85 110" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" className="closed-eye" />
            <path d="M115 110 Q125 120 135 110" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" className="closed-eye" />
            <circle cx="60" cy="125" r="10" fill="#FDA4AF" opacity="0.6" />
            <circle cx="140" cy="125" r="10" fill="#FDA4AF" opacity="0.6" />
            <polygon points="95,125 105,125 100,132" fill="#F43F5E" />
            <path d="M90 135 Q 100 145 100 135 Q 100 145 110 135" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </div>
      <div className={`peek-animal peek-giraffe ${isPasswordFocused && !showPassword ? 'covering-eyes' : ''}`}>
        <div className="animal-breathe">
          <svg viewBox="0 0 200 300" fill="none">
            <path d="M70 300 L 80 100 L 120 100 L 130 300 Z" fill="#FCD34D" />
            <circle cx="95" cy="150" r="12" fill="#B45309" />
            <circle cx="110" cy="200" r="15" fill="#B45309" />
            <circle cx="85" cy="250" r="10" fill="#B45309" />
            <ellipse cx="100" cy="80" rx="40" ry="30" fill="#FCD34D" />
            <ellipse cx="100" cy="65" rx="30" ry="20" fill="#FDE68A" />
            <circle cx="85" cy="75" r="5" fill="#1E293B" className="open-eye" />
            <circle cx="115" cy="75" r="5" fill="#1E293B" className="open-eye" />
            <path d="M80 75 Q85 80 90 75" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" className="closed-eye" />
            <path d="M110 75 Q115 80 120 75" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" className="closed-eye" />
            <line x1="85" y1="55" x2="80" y2="25" stroke="#FCD34D" strokeWidth="6" strokeLinecap="round" />
            <line x1="115" y1="55" x2="120" y2="25" stroke="#FCD34D" strokeWidth="6" strokeLinecap="round" />
            <ellipse cx="50" cy="80" rx="15" ry="8" transform="rotate(-15 50 80)" fill="#FCD34D" />
            <ellipse cx="150" cy="80" rx="15" ry="8" transform="rotate(15 150 80)" fill="#FCD34D" />
          </svg>
        </div>
      </div>
      <div className={`peek-animal peek-dog ${isPasswordFocused && !showPassword ? 'covering-eyes' : ''}`}>
        <div className="animal-breathe">
          <svg viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="60" fill="#E2E8F0" />
            <circle cx="120" cy="70" r="25" fill="#94A3B8" />
            <path d="M50 70 Q 20 120 40 150 Q 60 120 70 80" fill="#E2E8F0" />
            <path d="M150 70 Q 180 120 160 150 Q 140 120 130 80" fill="#94A3B8" />
            <circle cx="75" cy="90" r="6" fill="#1E293B" className="open-eye" />
            <circle cx="125" cy="90" r="6" fill="#1E293B" className="open-eye" />
            <path d="M69 90 Q75 95 81 90" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" className="closed-eye" />
            <path d="M119 90 Q125 95 131 90" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" className="closed-eye" />
            <circle cx="100" cy="105" r="10" fill="#0F172A" />
          </svg>
        </div>
      </div>

      {/* Main Container */}
      <div className="login-main-card-container">
        
        {/* Monkey anchored to top of card */}
        <div className={`card-monkey ${isPasswordFocused && !showPassword ? 'covering-eyes' : ''} ${isPasswordFocused && showPassword ? 'peeking-eyes' : ''}`}>
          <div className="animal-breathe">
            <svg viewBox="0 0 200 200" fill="none">
              <path d="M50 0 L 70 80" stroke="#78350F" strokeWidth="15" strokeLinecap="round" />
              <path d="M150 0 L 130 80" stroke="#78350F" strokeWidth="15" strokeLinecap="round" />
              <circle cx="100" cy="120" r="50" fill="#78350F" />
              <ellipse cx="100" cy="130" rx="40" ry="30" fill="#FDE68A" />
              <circle cx="40" cy="100" r="20" fill="#78350F" />
              <circle cx="40" cy="100" r="10" fill="#FDE68A" />
              <circle cx="160" cy="100" r="20" fill="#78350F" />
              <circle cx="160" cy="100" r="10" fill="#FDE68A" />
              <circle cx="85" cy="110" r="8" fill="#1E293B" className="open-eye" />
              <circle cx="115" cy="110" r="8" fill="#1E293B" className="open-eye" />
              <ellipse cx="100" cy="125" rx="5" ry="3" fill="#1E293B" />
              <path d="M90 140 Q 100 150 110 140" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
              <ellipse cx="85" cy="115" rx="22" ry="25" fill="#78350F" className="monkey-hand hand-left" />
              <ellipse cx="115" cy="115" rx="22" ry="25" fill="#78350F" className="monkey-hand hand-right" />
            </svg>
          </div>
        </div>

        {/* 2-Column Split Card */}
        <div className="split-login-card">
          
          {/* Left Column: Brand & Illustration */}
          <div className="card-left-banner">
            <div className="banner-logo-wrap">
              <img 
                src="/logopre.png" 
                alt="EduNeev Preschool Logo" 
                className="banner-brand-logo-img" 
              />
            </div>

            <h2 className="banner-motto">
              A Brighter Future<br/>
              for <span className="highlight-text-1">Every</span> <span className="highlight-text-2">Child</span>
            </h2>

            {/* Cute Illustration Image: Kids reading books */}
            <div className="kids-illustration-wrap">
              <img src="/kids_reading.png" alt="EduNeev Kids Reading Books" className="kids-reading-img" />
            </div>
          </div>

          {/* Right Column: Clean White Login Form */}
          <div className="card-right-form">
            <h1 className="form-welcome-title">Welcome Back!</h1>
            <p className="form-welcome-subtitle">Log in to your EduNeev account</p>

            {error && (
              <div className={`error-message ${shakeError ? 'shake' : ''}`}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="eduneev-modern-form">
              <div className="form-field-group">
                <label className="field-label">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="field-left-icon" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label className="field-label">Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="field-left-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    required
                  />
                  <button 
                    type="button" 
                    className="toggle-pwd-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-options-row">
                <label className="remember-checkbox-wrap">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-pwd-link" onClick={(e) => { e.preventDefault(); triggerError('Please contact School Admin to reset your password.'); }}>
                  Forgot Password?
                </a>
              </div>

              <button type="submit" className="green-signin-btn" disabled={loading}>
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>Sign In</span>
                    <div className="arrow-circle">
                      <ArrowRight size={14} color="#10B981" />
                    </div>
                  </>
                )}
              </button>

              <div className="form-card-footer">
                Don't have an account? <a href="/enquiry" className="contact-link">Contact School</a>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
