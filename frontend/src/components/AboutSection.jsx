import React from 'react';
import { FiMapPin, FiPhone, FiMail, FiCheckCircle } from 'react-icons/fi';

export default function AboutSection({ info = {} }) {
  const { aboutTitle = 'About Vector Junior College', aboutDescription = 'Vector Junior College has been a beacon of quality education, nurturing young minds for a bright future. With academic excellence and holistic development, we create tomorrow\'s leaders.', aboutImage = '' } = info;
  const highlights = ['CBSE & State Board Recognized', 'Modern Labs & Library', 'Expert Faculty Team', 'Scholarship Programs'];

  return (
    <section id="about" className="py-14 px-4 bg-[#F4F6FF]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-[16px] overflow-hidden aspect-[4/3]">
              {aboutImage ? (
                <img src={aboutImage} alt="About" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#E8EEF5] to-[#E0F2E9] flex items-center justify-center">
                  <FiCheckCircle className="text-[#27548A]" size={64} />
                </div>
              )}
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-5 -right-3 bg-[#27548A] text-white rounded-[16px] p-4 shadow-soft-lg">
              <div className="font-body text-2xl font-bold">25+</div>
              <div className="text-blue-100 text-xs font-medium">Years of Trust</div>
            </div>
            {/* Accent box */}
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-[#F7D774] rounded-[16px] -z-10 opacity-60" />
          </div>

          <div className="order-1 lg:order-2">
            <p className="section-subtitle">Who We Are</p>
            <h2 className="section-title mb-6">{aboutTitle}</h2>
            <p className="text-gray-500 font-sans leading-relaxed mb-8">{aboutDescription}</p>
            <div className="space-y-3 mb-8">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-[#E0F2E9] rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiCheckCircle className="text-[#7ED6A7]" size={14} />
                  </div>
                  <span className="text-gray-600 font-body font-medium text-sm">{h}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3 bg-[#F4F6FF] rounded-[16px] p-5 border border-[#E5E7EB]">
              {info.address && <div className="flex items-start gap-3 text-gray-500 text-sm font-sans"><FiMapPin className="text-[#27548A] mt-0.5 flex-shrink-0" size={15} /><span>{info.address}</span></div>}
              <div className="flex items-center gap-3 text-gray-500 text-sm font-sans"><FiPhone className="text-[#27548A] flex-shrink-0" size={15} /><a href="tel:+919502818877" className="hover:text-[#27548A] transition-colors duration-200 font-medium">+91 9502818877</a></div>
              {info.email && <div className="flex items-center gap-3 text-gray-500 text-sm font-sans"><FiMail className="text-[#27548A] flex-shrink-0" size={15} /><a href={`mailto:${info.email}`} className="hover:text-[#27548A] transition-colors duration-200">{info.email}</a></div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
