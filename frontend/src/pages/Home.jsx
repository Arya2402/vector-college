import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import MarqueeSection from '../components/MarqueeSection';
import StatsSection from '../components/StatsSection';
import AboutSection from '../components/AboutSection';
import NoticesSection from '../components/NoticesSection';
import CoursesSection from '../components/CoursesSection';
import GallerySection from '../components/GallerySection';
import TestimonialsSection from '../components/TestimonialsSection';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';
import {
  fetchHero, fetchCollegeInfo, fetchStats,
  fetchNotices, fetchCourses,
  fetchGallery, fetchTestimonials
} from '../api';

function RevealSection({ children, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(node); } },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${visible ? 'visible' : ''} ${className}`}>
      {children}
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState({
    hero: {}, collegeInfo: {}, stats: [],
    notices: [], courses: [],
    gallery: [], testimonials: [],
  });

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [hero, collegeInfo, stats, notices, courses, gallery, testimonials] = await Promise.allSettled([
          fetchHero(), fetchCollegeInfo(), fetchStats(),
          fetchNotices(), fetchCourses(),
          fetchGallery(), fetchTestimonials(),
        ]);
        setData({
          hero: hero.status === 'fulfilled' ? hero.value.data : {},
          collegeInfo: collegeInfo.status === 'fulfilled' ? collegeInfo.value.data : {},
          stats: stats.status === 'fulfilled' ? stats.value.data : [],
          notices: notices.status === 'fulfilled' ? notices.value.data : [],
          courses: courses.status === 'fulfilled' ? courses.value.data : [],
          gallery: gallery.status === 'fulfilled' ? gallery.value.data : [],
          testimonials: testimonials.status === 'fulfilled' ? testimonials.value.data : [],
        });
      } catch (err) {
        console.error('Failed to load content:', err);
      }
    };
    loadAll();
  }, []);

  // Get marquee items from hero data if available
  const marqueeItems = data.hero?.marqueeItems && data.hero.marqueeItems.length > 0 ? data.hero.marqueeItems : undefined;

  return (
    <div className="min-h-screen bg-[#F4F6FF] overflow-x-hidden">
      <Navbar noticeCount={data.notices.length} />
      <HeroSection hero={data.hero} collegeInfo={data.collegeInfo} />
      <MarqueeSection items={marqueeItems} />
      <RevealSection><StatsSection stats={data.stats} /></RevealSection>
      <RevealSection><AboutSection info={data.collegeInfo} /></RevealSection>
      {data.notices.length > 0 && <RevealSection><NoticesSection notices={data.notices} /></RevealSection>}
      <RevealSection><CoursesSection courses={data.courses} /></RevealSection>
      {data.gallery.length > 0 && <RevealSection><GallerySection gallery={data.gallery} /></RevealSection>}
      {data.testimonials.length > 0 && <RevealSection><TestimonialsSection testimonials={data.testimonials} /></RevealSection>}
      <RevealSection><ContactSection info={data.collegeInfo} /></RevealSection>
      <Footer info={data.collegeInfo} />
    </div>
  );
}
