import React from 'react';

export default function MarqueeSection({ items: customItems }) {
    const items = customItems && customItems.length > 0 ? customItems : [
        'Excellence in Education',
        'Shaping Future Leaders',
        'Quality Learning Since 1998',
        'Building Tomorrow\'s Innovators',
        'Academic Excellence Redefined',
    ];
    const repeated = [...items, ...items];

    return (
        <section id="marquee" className="py-3 bg-[#27548A] overflow-hidden">
            <div className="flex animate-marquee whitespace-nowrap">
                {repeated.map((item, i) => (
                    <span key={i} className="inline-flex items-center mx-8 text-white font-body text-sm font-medium tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-white mr-4 flex-shrink-0 opacity-70" />
                        {item}
                    </span>
                ))}
            </div>
        </section>
    );
}
