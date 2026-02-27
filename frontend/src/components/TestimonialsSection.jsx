import React from 'react';

export default function TestimonialsSection({ testimonials = [] }) {
  if (!testimonials.length) return null;
  return (
    <section className="py-14 px-4 bg-[#F4F6FF]">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-14">
          <p className="section-subtitle">Student Stories</p>
          <h2 className="section-title">What Our Students Say</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={t._id || i} className="bg-white rounded-[16px] p-6 border border-[#E5E7EB] hover:border-[#27548A]/30 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-200">
              <div className="text-[#27548A] text-3xl mb-4 font-sans">"</div>
              <p className="font-body text-gray-500 text-sm leading-relaxed mb-6 line-clamp-4 min-h-[5.5rem]" title={t.content}>{t.content}</p>
              <div className="flex items-center gap-3 pt-4 border-t border-[#F3F4F6]">
                <div className="w-10 h-10 rounded-[12px] bg-[#E8EEF5] overflow-hidden flex-shrink-0">
                  {t.image ? <img src={t.image} alt={t.name} className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center font-bold text-[#27548A] font-sans">{t.name.charAt(0)}</div>}
                </div>
                <div>
                  <div className="font-display font-medium text-sm text-gray-800">{t.name}</div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {t.course && <span className="text-[#27548A] text-[11px] font-bold font-display bg-[#E8EEF5] px-2 py-0.5 rounded-full">{t.course}</span>}
                    {t.rank && <span className="text-[#059669] text-[11px] font-bold font-display bg-[#D1FAE5] px-2 py-0.5 rounded-full">{t.rank}</span>}
                    {t.batch && <span className="text-gray-500 text-[10px] font-sans font-medium">{t.batch}</span>}
                  </div>
                </div>
                <div className="ml-auto text-[#F7D774] font-bold text-sm">{'★'.repeat(t.rating || 5)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
