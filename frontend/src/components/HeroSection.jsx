import React, { useState, useEffect } from 'react';
import { FiPhoneCall, FiPhone, FiMessageCircle } from 'react-icons/fi';

const TYPE_WORDS = [
  { text: 'Succeed', color: '#fde047' },
  { text: 'Grow', color: '#fde047' },
  { text: 'Achieve', color: '#fde047' },
  { text: 'Excel', color: '#fde047' },
];

function Carousel({ images = [] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => setCurrent(p => (p + 1) % images.length), 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="w-full h-[300px] md:h-[350px] lg:h-[400px] rounded-lg bg-gradient-to-br from-white/20 to-white/5 border border-white/20 flex items-center justify-center">
        <p className="text-white/60 text-sm font-medium">Upload images from Admin Panel</p>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <img
        src={images[current]}
        alt={`Slide ${current + 1}`}
        className="w-full h-[300px] md:h-[350px] lg:h-[400px] object-cover rounded-lg mx-auto transition-all duration-700"
      />
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${i === current ? 'bg-[#27548A]' : 'bg-gray-300'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HeroSection({ hero = {} }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    let timeout;
    const currentWord = TYPE_WORDS[wordIndex].text;
    if (typing) {
      if (displayedText.length < currentWord.length) {
        timeout = setTimeout(() => setDisplayedText(currentWord.slice(0, displayedText.length + 1)), 150);
      } else {
        timeout = setTimeout(() => setTyping(false), 1000);
      }
    } else {
      if (displayedText.length > 0) {
        timeout = setTimeout(() => setDisplayedText(displayedText.slice(0, -1)), 100);
      } else {
        setTyping(true);
        setWordIndex(p => (p + 1) % TYPE_WORDS.length);
      }
    }
    return () => clearTimeout(timeout);
  }, [displayedText, typing, wordIndex]);

  // The new schema uses a dedicated single string 'backgroundImage'
  const bgImage = hero.backgroundImage || (hero.backgroundImages && hero.backgroundImages[0]);

  // The Carousel on the right side still uses the array
  const images = hero.backgroundImages || [];

  return (
    <section className="relative overflow-hidden w-full">
      {/* Background layer */}
      <div className="absolute inset-0 z-0 w-full h-full">
        {bgImage ? (
          <img src={bgImage} alt="Background" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#1E3E62]" />
        )}
        <div className="absolute inset-0 bg-[#27548A]/80 backdrop-blur-[2px]" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 pt-32 pb-16 px-6 md:px-20">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10">
          {/* Text Section */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="font-extrabold text-[2rem] md:text-[2rem] lg:text-[2.8rem] leading-[1.2] text-white font-display">
              <div>Shape Your Future with</div>
              <div className="text-yellow-300 mt-1">Vector Academy</div>
              <div className="text-white">
                and{' '}
                <span style={{ color: TYPE_WORDS[wordIndex].color, minHeight: '1.5em' }} className="inline-block font-extrabold">
                  {displayedText}
                  <span className="border-r-2 border-white animate-pulse ml-1" />
                </span>
              </div>
            </h1>
            <p className="text-white font-medium text-base md:text-lg mt-4 text-justify max-w-xl mx-auto lg:mx-0">
              At <strong>Vector Academy</strong>, our expert faculty and comprehensive study materials help you prepare effectively for <strong>JEE</strong> and <strong>NEET</strong>, ensuring you achieve your dream of success.
            </p>
            <div className="mt-5">
              <a href="tel:+919502818877">
                <button className="bg-yellow-400 text-black px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-yellow-500 transition mx-auto lg:mx-0">
                  <FiPhoneCall size={20} /> Enquire Now
                </button>
              </a>
            </div>
          </div>

          {/* Image Carousel */}
          <div className="flex-1 w-full mt-1 lg:mt-0">
            <Carousel images={images} />
          </div>
        </div>
      </div>

      {/* Floating Buttons */}
      <div className="fixed bottom-6 right-4 flex flex-col gap-4 z-50">
        <a href="https://wa.me/919502818877" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-300">
          <FiMessageCircle size={20} /> WhatsApp
        </a>
        <a href="tel:+919502818877"
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-300">
          <FiPhone size={20} /> Call Us
        </a>
      </div>
    </section>
  );
}
