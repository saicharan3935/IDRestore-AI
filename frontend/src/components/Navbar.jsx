import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Terminal, User, LogOut } from 'lucide-react';

export default function Navbar({ onNavigate, onOpenAuth, user, onLogout }) {
  const navLinks = [
    { id: 'hero', label: 'Home' },
    { id: 'technology', label: 'Technology' },
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'about', label: 'Enterprise HRMS' },
  ];

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050709]/80 backdrop-blur-xl border-b border-[#22323D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => onNavigate('landing')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#101820] border border-[#00E5FF]/40 flex items-center justify-center shadow-cyan-glow group-hover:border-[#00E5FF] transition-all">
            <Sparkles className="w-5 h-5 text-[#00E5FF] group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div>
            <span className="text-lg font-bold font-mono tracking-wider text-[#F8FAFC]">
              IDRESTORE <span className="text-[#00E5FF]">AI</span>
            </span>
            <span className="block text-[9px] font-mono tracking-widest text-[#94A3B8] uppercase">
              OBSIDIAN FUTURISM EDITION
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="text-sm font-medium text-[#94A3B8] hover:text-[#00E5FF] transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          {user ? (
            /* Authenticated State */
            <div className="flex items-center space-x-3">
              <div
                onClick={() => onNavigate('dashboard', 'overview')}
                className="cursor-pointer flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-[#101820] border border-[#00FFA3]/40 hover:border-[#00FFA3] transition-all"
              >
                <div className="w-6 h-6 rounded-lg bg-[#17232C] text-[#00FFA3] flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="text-left hidden sm:block">
                  <span className="block text-xs font-mono font-bold text-[#F8FAFC] truncate max-w-[120px]">
                    {user.full_name || 'Officer'}
                  </span>
                  <span className="block text-[8px] font-mono text-[#00FFA3] uppercase tracking-wider">
                    {user.role || 'HR_ANALYST'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('dashboard', 'overview')}
                className="px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-[#00E5FF] text-black hover:bg-[#33EBFF] transition-all shadow-cyan-glow flex items-center space-x-1.5"
              >
                <span>WORKSPACE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-xl text-[#94A3B8] hover:text-[#FF5C5C] hover:bg-[#101820] border border-transparent hover:border-[#FF5C5C]/30 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Unauthenticated State */
            <>
              <button
                onClick={() => onOpenAuth('login', 'overview')}
                className="hidden sm:inline-flex px-4 py-2 rounded-lg text-xs font-mono font-medium text-[#DCE7EC] hover:text-[#00E5FF] border border-[#22323D] hover:border-[#00E5FF]/40 bg-[#101820]/50 transition-all"
              >
                Sign In
              </button>
              
              <button
                onClick={() => onOpenAuth('login', 'overview')}
                className="px-5 py-2.5 rounded-lg text-xs font-mono font-semibold bg-[#00E5FF] text-black hover:bg-[#33EBFF] transition-all flex items-center space-x-2 shadow-cyan-glow active:scale-95"
              >
                <span>LAUNCH WORKSPACE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
