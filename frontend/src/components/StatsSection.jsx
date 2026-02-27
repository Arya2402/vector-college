import React, { useState, useEffect, useRef } from 'react';
import { FiAward, FiStar, FiClock } from 'react-icons/fi';

const ICON_MAP = {
  'Students': FiAward,
  'Ranks': FiStar,
  'Hours': FiClock,
  'Success Rate': FiAward,
};

const COLOR_MAP = {
  'Students': 'text-indigo-500',
  'Ranks': 'text-yellow-500',
  'Hours': 'text-teal-500',
  'Success Rate': 'text-green-500',
};

const DEFAULT_STATS = [
  { label: 'Enrolled Students', value: '1500', icon: 'Students' },
  { label: 'Top Ranks', value: '350', icon: 'Ranks' },
  { label: 'Expert Sessions', value: '2500', icon: 'Hours' },
];

export default function StatsSection({ stats = [] }) {
  const items = stats.length > 0 ? stats : DEFAULT_STATS;
  const [counts, setCounts] = useState(items.map(() => 0));
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const intervals = items.map((item, i) => {
      const target = parseInt(String(item.value).replace(/[^0-9]/g, '')) || 0;
      if (target === 0) {
        setCounts(prev => prev.map((v, idx) => idx === i ? 0 : v));
        return null;
      }
      let count = 0;
      return setInterval(() => {
        count += Math.ceil(target / 100);
        if (count >= target) {
          count = target;
        }
        setCounts(prev => prev.map((v, idx) => idx === i ? count : v));
        if (count >= target) clearInterval(intervals[i]);
      }, 30);
    });
    return () => intervals.forEach(id => id && clearInterval(id));
  }, [started, items]);

  return (
    <div ref={ref} className="py-8 bg-white">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl mb-6 font-display">Our Achievements</h2>
        <p className="text-sm text-gray-600 max-w-xl mx-auto mb-8">
          Empowering success through quality education and expert mentorship. Join thousands of students achieving their dreams.
        </p>
        <div className={`grid grid - cols - 1 sm: grid - cols - 2 ${items.length >= 3 ? 'lg:grid-cols-3' : ''} gap - 6`}>
          {items.map((item, i) => {
            const Icon = ICON_MAP[item.icon] || ICON_MAP[item.label] || FiAward;
            const color = COLOR_MAP[item.icon] || COLOR_MAP[item.label] || 'text-indigo-500';
            const suffix = String(item.value).includes('%') ? '%' : '+';
            return (
              <div key={item._id || i} className="bg-[#F4F6FF] rounded-xl p-6 text-center shadow-md">
                <div className="flex justify-center mb-2"><Icon size={32} className={color} /></div>
                <div className="text-4xl font-bold text-gray-800 mb-2">{counts[i]}{suffix}</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">{item.label}</h3>
                {item.description && <p className="text-xs text-gray-600">{item.description}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
