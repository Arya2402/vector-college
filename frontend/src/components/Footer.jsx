import React from 'react';
import { FiMapPin, FiPhone, FiMail, FiArrowRight } from 'react-icons/fi';

export default function Footer({ info = {} }) {
  return (
    <footer className="bg-[#0f172a] pt-12 pb-6 px-4">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 bg-[#27548A] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm font-display">V</span>
              </div>
              <div>
                <div className="text-white font-display font-bold text-sm">Vector</div>
                <div className="text-[#27548A] text-[9px] font-semibold tracking-widest uppercase">Academy</div>
              </div>
            </div>
            <p className="text-gray-400 font-body text-xs leading-relaxed">Empowering students with knowledge and shaping tomorrow's leaders.</p>
          </div>
          <div>
            <h4 className="text-white font-display font-semibold text-xs uppercase tracking-wider mb-3">Quick Links</h4>
            <div className="space-y-1.5">
              {['About', 'Courses', 'Gallery', 'Contact'].map(l => (
                <button key={l} onClick={() => document.querySelector(`#${l.toLowerCase()}`)?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white font-body text-xs transition-colors duration-200 group">
                  <FiArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />{l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-display font-semibold text-xs uppercase tracking-wider mb-3">Contact</h4>
            <div className="space-y-2 text-gray-400 font-body text-xs">
              {info.address && <div className="flex items-start gap-2"><FiMapPin className="text-[#27548A] mt-0.5 flex-shrink-0" size={12} /><span>{info.address}</span></div>}
              {info.phone && <div className="flex items-center gap-2"><FiPhone className="text-[#27548A] flex-shrink-0" size={12} /><a href={`tel:+${info.phone.replace(/\D/g, '')}`} className="hover:text-white transition-colors font-medium">{info.phone}</a></div>}
              {info.email && <div className="flex items-center gap-2"><FiMail className="text-[#27548A] flex-shrink-0" size={12} /><a href={`mailto:${info.email}`} className="hover:text-white transition-colors">{info.email}</a></div>}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-gray-500 font-body text-[10px]">&copy; {new Date().getFullYear()} Vector Academy. All rights reserved.</p>
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#27548A]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#7ED6A7]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#F7D774]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#F28B82]" />
          </div>
        </div>
      </div>
    </footer>
  );
}
