import React from 'react';
import { FiMapPin, FiPhone, FiMail, FiMessageCircle } from 'react-icons/fi';

export default function ContactSection({ info = {} }) {
  const { address, phone, email, mapEmbedUrl } = info;
  const waNumber = phone ? phone.replace(/\D/g, '') : '';
  return (
    <section id="contact" className="py-14 px-4 bg-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-10">
          <p className="text-[#27548A] font-semibold tracking-widest text-[10px] uppercase mb-2 font-sans">Get In Touch</p>
          <h2 className="font-body text-2xl md:text-3xl font-bold text-gray-900">Contact Us</h2>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <h3 className="font-display font-bold text-lg text-gray-900 mb-4">Reach Out To Us</h3>
              <div className="space-y-4">
                {address && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-[#E8EEF5] rounded-xl flex items-center justify-center flex-shrink-0"><FiMapPin className="text-[#27548A]" size={16} /></div>
                    <div><div className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Address</div><div className="text-gray-600 text-sm font-sans">{address}</div></div>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#E8EEF5] rounded-xl flex items-center justify-center flex-shrink-0"><FiPhone className="text-[#27548A]" size={16} /></div>
                    <div><div className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Phone</div><a href={`tel:+${waNumber}`} className="text-gray-700 font-semibold text-sm hover:text-[#27548A] transition-colors">{phone}</a></div>
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#E8EEF5] rounded-xl flex items-center justify-center flex-shrink-0"><FiMail className="text-[#27548A]" size={16} /></div>
                    <div><div className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Email</div><a href={`mailto:${email}`} className="text-gray-700 font-semibold text-sm hover:text-[#27548A] transition-colors">{email}</a></div>
                  </div>
                )}
              </div>
            </div>
            {waNumber && (
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full bg-[#25D366] hover:bg-[#1fb855] text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98] text-sm">
                <FiMessageCircle size={18} /> Chat on WhatsApp
              </a>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
            {mapEmbedUrl ? (
              <iframe src={mapEmbedUrl} width="100%" height="380" style={{ border: 0 }} allowFullScreen loading="lazy" title="Map" />
            ) : (
              <div className="p-5">
                <h3 className="font-display font-bold text-gray-900 text-lg mb-4">Quick Enquiry</h3>
                <form className="space-y-3" onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const { submitEnquiry } = await import('../api');
                    const { toast } = await import('react-hot-toast');
                    const formData = new FormData(e.target);
                    await submitEnquiry(Object.fromEntries(formData));
                    toast.success("Enquiry sent successfully!");
                    e.target.reset();
                  } catch (err) {
                    const { toast } = await import('react-hot-toast');
                    toast.error("Failed to send enquiry.");
                  }
                }}>
                  <input type="text" name="name" required placeholder="Your Name" className="input-field text-sm" />
                  <input type="tel" name="mobile" required placeholder="Mobile Number" className="input-field text-sm" />
                  <select name="course" required className="input-field text-sm appearance-none">
                    <option value="">Select Course</option>
                    {info?.courseOptions?.length > 0 ? (
                      info.courseOptions.map(c => <option key={c} value={c}>{c}</option>)
                    ) : (
                      <>
                        <option value="JEE Mains">JEE Mains</option>
                        <option value="NEET">NEET</option>
                      </>
                    )}
                  </select>
                  <textarea name="message" required placeholder="Your Message" rows={3} className="input-field resize-none text-sm" />
                  <button type="submit" className="btn-primary w-full text-center block text-sm border-none cursor-pointer">
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
