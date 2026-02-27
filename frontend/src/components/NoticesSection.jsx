import React from 'react';
import { FiBell, FiCalendar } from 'react-icons/fi';

const tagStyle = {
  Important: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]',
  Admission: 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]',
  Exam: 'bg-[#E8EEF5] text-[#27548A] border-[#D6E4FB]',
  Event: 'bg-[#F3E8FF] text-[#7C3AED] border-[#E9D5FF]',
  General: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function NoticesSection({ notices = [] }) {
  if (!notices.length) return null;
  return (
    <section id="notices" className="py-14 px-4 bg-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <p className="section-subtitle">Latest Updates</p>
          <h2 className="section-title">Notices & Announcements</h2>
        </div>
        <div className="space-y-4 max-w-3xl mx-auto">
          {notices.map((n, i) => (
            <div key={n._id || i} className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 hover:border-[#27548A]/30 hover:shadow-soft-md transition-all duration-200 group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#E8EEF5] rounded-[12px] flex items-center justify-center flex-shrink-0 group-hover:bg-[#D6E4FB] transition-colors duration-200">
                  <FiBell className="text-[#27548A]" size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-gray-800 font-display font-semibold text-sm">{n.title}</h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold flex-shrink-0 ${tagStyle[n.tag] || tagStyle.General}`}>{n.tag}</span>
                  </div>
                  <p className="text-gray-500 font-body text-sm leading-relaxed mb-3">{n.content}</p>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-sans">
                    <FiCalendar size={11} />
                    {new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
