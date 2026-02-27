import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

const categories = ['All', 'Campus', 'Events', 'Sports', 'Academics', 'Celebrations'];

export default function GallerySection({ gallery = [] }) {
  const [filter, setFilter] = useState('All');
  const [lightbox, setLightbox] = useState(null);
  if (!gallery.length) return null;
  const filtered = filter === 'All' ? gallery : gallery.filter(g => g.category === filter);

  return (
    <section id="gallery" className="py-14 px-4 bg-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <p className="section-subtitle">Campus Life</p>
          <h2 className="section-title">Our Gallery</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-3 mb-10 justify-center flex-wrap">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-body font-medium transition-all duration-200 ${filter === cat ? 'bg-[#27548A] text-white shadow-soft' : 'bg-[#F4F6FF] text-gray-500 hover:bg-[#E8EEF5] hover:text-[#27548A] border border-[#E5E7EB]'}`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item, i) => (
            <button key={item._id || i} onClick={() => setLightbox(item)}
              className="group relative aspect-square rounded-[16px] overflow-hidden bg-[#F4F6FF] border border-[#E5E7EB] hover:border-[#27548A]/30 hover:shadow-soft-lg transition-all duration-200">
              {item.image ? (
                <>
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-4">
                    <span className="text-white text-xs font-medium">{item.title}</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🖼️</div>
              )}
            </button>
          ))}
        </div>
      </div>
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 z-10 transition-colors duration-200">
            <FiX size={20} />
          </button>
          <img src={lightbox.image} alt={lightbox.title} className="max-w-full max-h-[85vh] rounded-[16px] object-contain" onClick={e => e.stopPropagation()} />
          <div className="absolute bottom-6 bg-white/20 backdrop-blur-sm text-white font-medium text-sm px-4 py-2 rounded-full">
            {lightbox.title} · {lightbox.category}
          </div>
        </div>
      )}
    </section>
  );
}
