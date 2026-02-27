import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBell, FiMenu, FiX, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Courses', href: '#courses' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar({ noticeCount = 0 }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = (href) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  const textColor = scrolled ? 'text-gray-700' : 'text-white/90';
  const hoverColor = scrolled ? 'hover:text-[#27548A] hover:bg-[#E8EEF5]' : 'hover:text-white hover:bg-white/10';
  const logoText = scrolled ? 'text-gray-800' : 'text-white';
  const logoSub = scrolled ? 'text-[#27548A]' : 'text-white/70';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-2.5' : 'bg-transparent py-4'}`}>
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
        <button onClick={() => scrollTo('#home')} className="flex items-center gap-2 group">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${scrolled ? 'bg-[#27548A]' : 'bg-white/20 backdrop-blur-sm'}`}>
            <span className="text-white font-bold text-sm font-sans">V</span>
          </div>
          <div>
            <div className={`${logoText} font-display font-bold text-sm leading-tight transition-colors duration-300`}>Vector</div>
            <div className={`${logoSub} text-[9px] font-display font-semibold tracking-widest uppercase transition-colors duration-300`}>Academy</div>
          </div>
        </button>

        <div className="hidden lg:flex items-center gap-0.5">
          {navLinks.map(l => (
            <button key={l.label} onClick={() => scrollTo(l.href)}
              className={`${textColor} ${hoverColor} font-body text-[13px] font-medium px-3.5 py-2 rounded-lg transition-all duration-300`}>
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          {noticeCount > 0 && (
            <button onClick={() => scrollTo('#notices')} className={`relative ${scrolled ? 'text-gray-400' : 'text-white/70'} hover:text-[#27548A] transition-colors duration-300`}>
              <FiBell size={18} />
              <span className="absolute -top-1 -right-1 bg-[#F28B82] text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                {noticeCount > 9 ? '9+' : noticeCount}
              </span>
            </button>
          )}
          {isAdmin && (
            <Link to="/admin" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${scrolled ? 'bg-[#27548A] text-white hover:bg-[#4478D6]' : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm'}`}>
              <FiShield size={12} /> Admin
            </Link>
          )}
          <button onClick={() => setOpen(!open)} className={`lg:hidden p-1 transition-colors duration-300 ${scrolled ? 'text-gray-500' : 'text-white'}`}>
            {open ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-0.5 shadow-lg animate-fade-up">
          {navLinks.map(l => (
            <button key={l.label} onClick={() => scrollTo(l.href)}
              className="w-full text-left text-gray-600 hover:text-[#27548A] hover:bg-gray-50 font-body font-medium text-sm px-4 py-2.5 rounded-lg transition-all duration-200">
              {l.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
