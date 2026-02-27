import React from 'react';
import { FiClock, FiUsers, FiBookOpen } from 'react-icons/fi';

const cardColors = [
  'from-[#E8EEF5] to-[#D6E4FB]',
  'from-[#FEE2E2] to-[#FECACA]',
  'from-[#FEF3C7] to-[#FDE68A]',
  'from-[#D1FAE5] to-[#A7F3D0]',
  'from-[#E0F2FE] to-[#BAE6FD]',
  'from-[#F3E8FF] to-[#E9D5FF]',
];

const defaultCourses = [
  { title: 'MPC', description: 'Maths, Physics, Chemistry -- For aspiring engineers and scientists.', duration: '2 Years', seats: '60' },
  { title: 'BiPC', description: 'Biology, Physics, Chemistry -- For medical and life science aspirants.', duration: '2 Years', seats: '60' },
  { title: 'MEC', description: 'Maths, Economics, Commerce -- For future business leaders.', duration: '2 Years', seats: '60' },
  { title: 'HEC', description: 'History, Economics, Civics -- For arts and humanities students.', duration: '2 Years', seats: '60' },
];

export default function CoursesSection({ courses = [] }) {
  const items = courses.length > 0 ? courses : defaultCourses;
  return (
    <section id="courses" className="py-14 px-4 bg-[#F4F6FF]">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-14">
          <p className="section-subtitle">What We Offer</p>
          <h2 className="section-title">Our Programs</h2>
          <p className="text-gray-400 font-sans max-w-xl mx-auto mt-3 text-sm">Choose the right path for your future career.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((c, i) => (
            <div key={c._id || i} className="group rounded-[16px] overflow-hidden hover:-translate-y-1 hover:scale-[1.02] transition-all duration-200 shadow-soft hover:shadow-soft-lg cursor-pointer border border-[#E5E7EB]">
              {c.image ? (
                <div className="h-44 overflow-hidden relative">
                  <img src={c.image} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${cardColors[i % cardColors.length]} opacity-30`} />
                </div>
              ) : (
                <div className={`h-44 bg-gradient-to-br ${cardColors[i % cardColors.length]} flex items-center justify-center`}>
                  <div className="w-16 h-16 bg-white/60 rounded-[16px] flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <FiBookOpen className="text-gray-600" size={28} />
                  </div>
                </div>
              )}
              <div className="bg-white p-5">
                <h3 className="text-gray-800 font-display font-bold text-lg mb-1">{c.title}</h3>
                <p className="text-gray-400 font-body text-xs leading-relaxed mb-4">{c.description}</p>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1 text-[#27548A] bg-[#E8EEF5] px-2.5 py-1 rounded-lg"><FiClock size={11} /> {c.duration}</span>
                  <span className="flex items-center gap-1 text-[#7ED6A7] bg-[#E0F2E9] px-2.5 py-1 rounded-lg"><FiUsers size={11} /> {c.seats} seats</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-14">
          <button onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })} className="btn-primary text-base">
            Apply for Admission
          </button>
        </div>
      </div>
    </section>
  );
}
