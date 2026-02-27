import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiHome, FiInfo, FiBook, FiImage, FiBell,
  FiMessageSquare, FiBarChart2, FiLogOut, FiPlus, FiEdit3,
  FiTrash2, FiEye, FiEyeOff, FiSave, FiUpload, FiX, FiMenu
} from 'react-icons/fi';
import * as api from '../api';

function ImageUploader({ value, onChange, label = 'Image' }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try { const res = await api.uploadImage(file); onChange(res.data.url); toast.success('Image uploaded!'); }
    catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };
  return (
    <div>
      <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">{label}</label>
      <div className="flex gap-2 items-start">
        <div className="flex-1"><input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Paste image URL or upload" className="input-field text-sm" /></div>
        <label className={`flex-shrink-0 flex items-center gap-1.5 bg-[#F4F6FF] hover:bg-[#E8EEF5] text-gray-600 text-sm font-medium px-3 py-3 rounded-[12px] cursor-pointer transition-colors border border-[#E5E7EB] ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
          {uploading ? <div className="w-4 h-4 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /> : <FiUpload size={14} />}
          {uploading ? 'Uploading...' : 'Upload'}
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
        </label>
      </div>
      {value && <img src={value} alt="" className="mt-2 h-20 rounded-[12px] object-cover border border-[#E5E7EB]" />}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white border border-[#E5E7EB] rounded-t-[16px] sm:rounded-[16px] w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-soft-lg animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB] sticky top-0 bg-white z-10 rounded-t-[16px]">
          <h3 className="text-gray-800 font-display font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1"><FiX /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ItemForm({ fields, initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({ ...initial });
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => (
        <div key={field.key}>
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">{field.label}</label>
          {field.type === 'image' ? (
            <ImageUploader value={form[field.key]} onChange={val => set(field.key, val)} label={field.label} />
          ) : field.type === 'textarea' ? (
            <textarea value={form[field.key] || ''} onChange={e => set(field.key, e.target.value)} placeholder={field.placeholder} rows={3} className="input-field resize-none text-sm" required={field.required} />
          ) : field.type === 'select' ? (
            <select value={form[field.key] || ''} onChange={e => set(field.key, e.target.value)} className="input-field text-sm">
              {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : field.type === 'checkbox' ? (
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form[field.key] !== undefined ? form[field.key] : true} onChange={e => set(field.key, e.target.checked)} className="w-4 h-4 accent-[#27548A]" />
              <span className="text-gray-600 text-sm font-sans">{field.checkLabel || 'Active'}</span>
            </label>
          ) : (
            <input type={field.type || 'text'} value={form[field.key] || ''} onChange={e => set(field.key, e.target.value)} placeholder={field.placeholder} className="input-field text-sm" required={field.required} />
          )}
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"><FiSave size={14} /> Save</button>
        <button type="button" onClick={onCancel} className="btn-outline flex-1 text-sm">Cancel</button>
      </div>
    </form>
  );
}

function SectionManager({ title, fetchFn, createFn, updateFn, deleteFn, fields }) {
  const [data, setData] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadData = async () => {
    try { const res = await fetchFn(true); setData(res.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);
  const handleSave = async (formData) => {
    try {
      if (modal?.type === 'edit') { await updateFn(modal.item._id, formData); toast.success('Updated!'); }
      else { await createFn(formData); toast.success('Created!'); }
      setModal(null); loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await deleteFn(id); toast.success('Deleted'); loadData(); }
    catch { toast.error('Delete failed'); }
  };
  const handleToggle = async (item) => {
    try { await updateFn(item._id, { ...item, isActive: !item.isActive }); loadData(); }
    catch { toast.error('Toggle failed'); }
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-gray-800 font-display font-semibold text-lg">{title}</h2>
        <button onClick={() => setModal({ type: 'create', item: {} })} className="flex items-center gap-1.5 btn-primary text-sm py-2 px-4"><FiPlus size={14} /> Add New</button>
      </div>
      {loading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div> :
        data.length === 0 ? <div className="text-center py-10 text-gray-400 font-sans">No items yet. Add one!</div> : (
          <div className="space-y-3">
            {data.map(item => (
              <div key={item._id} className={`bg-white rounded-[12px] border border-l-4 p-4 shadow-soft ${item.isActive !== false ? 'border-l-[#27548A] border-[#E5E7EB]' : 'border-l-gray-300 border-[#E5E7EB] opacity-60'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-800 font-body font-medium text-sm truncate">{item.title || item.name || item.label || item.value || 'Untitled'}</div>
                    {(item.description || item.content || item.subject || item.qualification) && <div className="text-gray-400 font-body text-xs mt-1 line-clamp-1">{item.description || item.content || item.subject || item.qualification}</div>}
                    {item.tag && <span className="mt-1 inline-block text-xs bg-[#E8EEF5] text-[#27548A] px-2 py-0.5 rounded-full font-medium">{item.tag}</span>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.hasOwnProperty('isActive') && <button onClick={() => handleToggle(item)} className="p-2 text-gray-400 hover:text-[#27548A] transition-colors">{item.isActive ? <FiEye size={14} /> : <FiEyeOff size={14} />}</button>}
                    <button onClick={() => setModal({ type: 'edit', item })} className="p-2 text-gray-400 hover:text-[#27548A] transition-colors"><FiEdit3 size={14} /></button>
                    <button onClick={() => handleDelete(item._id)} className="p-2 text-gray-400 hover:text-[#F28B82] transition-colors"><FiTrash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      {modal && <Modal title={modal.type === 'edit' ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`} onClose={() => setModal(null)}><ItemForm fields={fields} initial={modal.item} onSave={handleSave} onCancel={() => setModal(null)} /></Modal>}
    </div>
  );
}

function SingletonEditor({ title, fetchFn, saveFn, fields }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => { fetchFn().then(res => setData(res.data)).catch(() => toast.error('Load failed')).finally(() => setLoading(false)); }, [fetchFn]);
  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await saveFn(data); toast.success('Saved!'); }
    catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };
  if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div>;
  return (
    <div>
      <h2 className="text-gray-800 font-display font-semibold text-lg mb-5">{title}</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(field => (
            <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">{field.label}</label>
              {field.type === 'image' ? <ImageUploader value={data[field.key]} onChange={val => setData(p => ({ ...p, [field.key]: val }))} label={field.label} />
                : field.type === 'textarea' ? <textarea value={data[field.key] || ''} onChange={e => setData(p => ({ ...p, [field.key]: e.target.value }))} rows={4} className="input-field resize-none text-sm" />
                  : field.type === 'array' ? <input type="text" value={(Array.isArray(data[field.key]) ? data[field.key] : []).join(', ')} onChange={e => setData(p => ({ ...p, [field.key]: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} placeholder={field.placeholder} className="input-field text-sm" />
                    : field.type === 'checkbox' ? <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={!!data[field.key]} onChange={e => setData(p => ({ ...p, [field.key]: e.target.checked }))} className="w-4 h-4 accent-[#27548A]" /><span className="text-gray-600 text-sm font-sans">{field.checkLabel}</span></label>
                      : <input type={field.type || 'text'} value={data[field.key] || ''} onChange={e => setData(p => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} className="input-field text-sm" />}
            </div>
          ))}
        </div>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave size={14} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

// ==================== FIELD DEFINITIONS ====================
const noticeFields = [
  { key: 'title', label: 'Title', required: true, placeholder: 'Notice title' },
  { key: 'content', label: 'Content', type: 'textarea', required: true },
  { key: 'tag', label: 'Tag', type: 'select', options: ['General', 'Important', 'Admission', 'Exam', 'Event'] },
  { key: 'isActive', label: 'Visibility', type: 'checkbox', checkLabel: 'Show on website' },
];
const courseFields = [
  { key: 'title', label: 'Course Title', required: true },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'image', label: 'Course Image', type: 'image' },
  { key: 'duration', label: 'Duration', placeholder: '2 Years' },
  { key: 'seats', label: 'No. of Seats', placeholder: '60' },
  { key: 'order', label: 'Display Order', type: 'number' },
  { key: 'isActive', label: 'Visibility', type: 'checkbox', checkLabel: 'Show on website' },
];
const galleryFields = [
  { key: 'title', label: 'Title', required: true },
  { key: 'image', label: 'Image', type: 'image', required: true },
  { key: 'category', label: 'Category', type: 'select', options: ['Campus', 'Events', 'Sports', 'Academics', 'Celebrations'] },
  { key: 'order', label: 'Display Order', type: 'number' },
  { key: 'isActive', label: 'Visibility', type: 'checkbox', checkLabel: 'Show on website' },
];
const testimonialFields = [
  { key: 'name', label: 'Student Name', required: true },
  { key: 'course', label: 'Course (e.g., JEE Mains)', placeholder: 'JEE Mains / NEET / EAMCET' },
  { key: 'rank', label: 'Rank / Percentile', placeholder: 'AIR 140 / 99.9%ile' },
  { key: 'batch', label: 'Batch Year', placeholder: '2022' },
  { key: 'content', label: 'Testimonial', type: 'textarea', required: true },
  { key: 'rating', label: 'Rating (1-5)', type: 'number' },
  { key: 'image', label: 'Photo', type: 'image' },
  { key: 'isActive', label: 'Visibility', type: 'checkbox', checkLabel: 'Show on website' },
];
const statsFields = [
  { key: 'icon', label: 'Icon Key', placeholder: 'users / book / award / star' },
  { key: 'value', label: 'Value', required: true, placeholder: '5000+' },
  { key: 'label', label: 'Label', required: true, placeholder: 'Alumni' },
  { key: 'order', label: 'Display Order', type: 'number' },
];
// ==================== HERO EDITOR (with multiple images + marquee items) ====================
function HeroEditor() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.fetchHero().then(r => setData(r.data)).catch(() => toast.error('Load failed')).finally(() => setLoading(false)); }, []);
  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.updateHero({
        ...data,
        backgroundImages: data.backgroundImages || [],
        marqueeItems: data.marqueeItems || [],
      });
      toast.success('Saved!');
    }
    catch (err) { toast.error(err?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };
  const addImage = () => setData(p => ({ ...p, backgroundImages: [...(p.backgroundImages || []), ''] }));
  const updateImage = (i, v) => setData(p => ({ ...p, backgroundImages: (p.backgroundImages || []).map((img, idx) => idx === i ? v : img) }));
  const removeImage = (i) => setData(p => ({ ...p, backgroundImages: (p.backgroundImages || []).filter((_, idx) => idx !== i) }));
  const addMarquee = () => setData(p => ({ ...p, marqueeItems: [...(p.marqueeItems || []), ''] }));
  const updateMarquee = (i, v) => setData(p => ({ ...p, marqueeItems: (p.marqueeItems || []).map((m, idx) => idx === i ? v : m) }));
  const removeMarquee = (i) => setData(p => ({ ...p, marqueeItems: (p.marqueeItems || []).filter((_, idx) => idx !== i) }));
  if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div>;
  return (
    <div>
      <h2 className="text-gray-800 font-display font-semibold text-lg mb-5">Hero Banner</h2>
      <form onSubmit={handleSave} className="space-y-5">
        <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">College Name / Heading</label>
          <input type="text" value={data.title || ''} onChange={e => setData(p => ({ ...p, title: e.target.value }))} className="input-field text-sm" /></div>
        <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Subtitle / Tagline</label>
          <input type="text" value={data.subtitle || ''} onChange={e => setData(p => ({ ...p, subtitle: e.target.value }))} className="input-field text-sm" /></div>
        <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Description</label>
          <textarea value={data.description || ''} onChange={e => setData(p => ({ ...p, description: e.target.value }))} rows={3} className="input-field resize-none text-sm" /></div>
        <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">CTA Button Text</label>
          <input type="text" value={data.buttonText || ''} onChange={e => setData(p => ({ ...p, buttonText: e.target.value }))} placeholder="Explore Now" className="input-field text-sm" /></div>
        {/* ── Background Image (full-page overlay) ── */}
        <div>
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 block">Hero Full Background Image</label>
          <p className="text-gray-400 text-xs mb-2">Fills the entire hero section. A dark blue overlay is applied on top automatically.</p>
          <ImageUploader value={data.backgroundImage || ''} onChange={val => setData(p => ({ ...p, backgroundImage: val }))} label="Background Image" />
          {data.backgroundImage && (
            <div className="relative mt-2 rounded-xl overflow-hidden h-20">
              <img src={data.backgroundImage} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-[#1E3E62] opacity-70" />
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">With dark overlay</span>
            </div>
          )}
        </div>

        {/* ── Right-side Carousel ── */}
        <div>
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Right Carousel Slides</label>
          <p className="text-gray-400 text-xs mb-2">Images that cycle in the right-side carousel panel.</p>
          <div className="space-y-3">
            {(data.backgroundImages || []).map((img, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-[10px] font-semibold">Slide {i + 1}</span>
                  <button type="button" onClick={() => removeImage(i)} className="text-[#F28B82] hover:text-[#DC2626] p-1"><FiTrash2 size={13} /></button>
                </div>
                <ImageUploader value={img} onChange={val => updateImage(i, val)} label={`Slide ${i + 1}`} />
              </div>
            ))}
          </div>
          <button type="button" onClick={addImage} className="text-[#27548A] text-xs font-medium hover:underline flex items-center gap-1 mt-2"><FiPlus size={12} /> Add Slide</button>
        </div>
        <div>
          <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Marquee Scrolling Text</label>
          <p className="text-gray-400 text-xs mb-2">These texts scroll on the blue strip below the hero.</p>
          {(data.marqueeItems || []).map((item, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" value={item} onChange={e => updateMarquee(i, e.target.value)} placeholder="Scrolling text item" className="input-field text-sm flex-1" />
              <button type="button" onClick={() => removeMarquee(i)} className="text-[#F28B82] hover:text-[#DC2626] p-1.5"><FiTrash2 size={14} /></button>
            </div>
          ))}
          <button type="button" onClick={addMarquee} className="text-[#27548A] text-xs font-medium hover:underline flex items-center gap-1"><FiPlus size={12} /> Add Item</button>
        </div>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave size={14} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
const collegeInfoFields = [
  { key: 'aboutTitle', label: 'About Section Title' },
  { key: 'aboutDescription', label: 'About Description', type: 'textarea' },
  { key: 'aboutImage', label: 'About Section Image', type: 'image' },
  { key: 'address', label: 'Address' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'email', label: 'Email Address', type: 'email' },
  { key: 'mapEmbedUrl', label: 'Google Maps Embed URL', placeholder: 'https://www.google.com/maps/embed?...' },
  { key: 'admissionYear', label: 'Current Admission Year', placeholder: 'e.g. 2024-25' },
  { key: 'courseOptions', label: 'Available Courses Form Options', type: 'array', placeholder: 'JEE Mains, NEET, CA Foundation' },
  { key: 'admissionOpen', label: 'Admission Status', type: 'checkbox', checkLabel: 'Admissions Currently Open' },
];

const sections = [
  { key: 'hero', label: 'Hero Banner', icon: FiHome },
  { key: 'college-info', label: 'College Info', icon: FiInfo },
  { key: 'stats', label: 'Stats', icon: FiBarChart2 },
  { key: 'notices', label: 'Notices', icon: FiBell },
  { key: 'courses', label: 'Courses', icon: FiBook },
  { key: 'gallery', label: 'Gallery', icon: FiImage },
  { key: 'testimonials', label: 'Testimonials', icon: FiMessageSquare },
  { key: 'enquiries', label: 'Enquiries', icon: FiMessageSquare },
];

function EnquiriesManager() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try { const res = await api.fetchEnquiries(); setData(res.data); }
    catch { toast.error('Failed to load enquiries'); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return;
    try { await api.deleteEnquiry(id); toast.success('Deleted'); loadData(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-gray-800 font-display font-semibold text-lg">Website Enquiries</h2>
      </div>
      {loading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div> :
        data.length === 0 ? <div className="text-center py-10 text-gray-400 font-sans">No enquiries yet.</div> : (
          <div className="space-y-4">
            {data.map(item => (
              <div key={item._id} className="bg-white rounded-[12px] border border-gray-200 p-5 shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-display font-bold text-gray-900 leading-tight">{item.name}</h3>
                    <div className="text-sm font-body text-gray-500 mt-1 whitespace-pre-wrap">{item.message}</div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="bg-[#E8EEF5] text-[#27548A] px-2 py-1 rounded-md">Course: {item.course}</span>
                      <a href={`tel:${item.mobile}`} className="bg-green-100 text-green-700 px-2 py-1 rounded-md hover:bg-green-200 transition-colors">📞 {item.mobile}</a>
                      <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-md">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(item._id)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><FiTrash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

export default function AdminDashboard() {
  const [active, setActive] = useState('hero');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/vector-admin-login'); toast.success('Logged out'); };

  const renderSection = () => {
    switch (active) {
      case 'hero': return <HeroEditor />;
      case 'college-info': return <SingletonEditor key="college-info" title="College Info" fetchFn={api.fetchCollegeInfo} saveFn={api.updateCollegeInfo} fields={collegeInfoFields} />;
      case 'stats': return <SectionManager key="stats" title="Stats" fetchFn={api.fetchStats} createFn={api.createStat} updateFn={api.updateStat} deleteFn={api.deleteStat} fields={statsFields} />;
      case 'notices': return <SectionManager key="notices" title="Notices" fetchFn={api.fetchNotices} createFn={api.createNotice} updateFn={api.updateNotice} deleteFn={api.deleteNotice} fields={noticeFields} />;
      case 'courses': return <SectionManager key="courses" title="Courses" fetchFn={api.fetchCourses} createFn={api.createCourse} updateFn={api.updateCourse} deleteFn={api.deleteCourse} fields={courseFields} />;
      case 'gallery': return <SectionManager key="gallery" title="Gallery" fetchFn={api.fetchGallery} createFn={api.createGallery} updateFn={api.updateGallery} deleteFn={api.deleteGallery} fields={galleryFields} />;
      case 'testimonials': return <SectionManager key="testimonials" title="Testimonials" fetchFn={api.fetchTestimonials} createFn={api.createTestimonial} updateFn={api.updateTestimonial} deleteFn={api.deleteTestimonial} fields={testimonialFields} />;
      case 'enquiries': return <EnquiriesManager key="enquiries" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FF] flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:static top-0 left-0 h-full z-50 w-64 bg-white border-r border-[#E5E7EB] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#27548A] rounded-[10px] flex items-center justify-center"><span className="text-white font-bold text-xs font-sans">V</span></div>
              <div><div className="text-gray-800 font-display font-semibold text-sm">Admin Panel</div><div className="text-gray-400 text-xs">Website CMS</div></div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400"><FiX /></button>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest px-3 pt-2 pb-1">Manage</div>
          {sections.map(s => {
            const Icon = s.icon;
            return <button key={s.key} onClick={() => { setActive(s.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-body font-medium transition-all ${active === s.key ? 'bg-[#E8EEF5] text-[#27548A]' : 'text-gray-500 hover:text-gray-700 hover:bg-[#F4F6FF]'}`}>
              <Icon size={16} />{s.label}
            </button>;
          })}
        </nav>
        <div className="p-3 border-t border-[#E5E7EB] space-y-1">
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-body text-gray-500 hover:text-gray-700 hover:bg-[#F4F6FF] transition-all"><FiHome size={16} /> View Website</button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-body text-gray-500 hover:text-[#F28B82] hover:bg-[#FEE2E2] transition-all"><FiLogOut size={16} /> Logout</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB] px-4 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors"><FiMenu size={22} /></button>
          <h1 className="text-gray-800 font-display font-semibold text-lg">{sections.find(s => s.key === active)?.label || 'Dashboard'}</h1>
        </div>
        <div className="p-4 sm:p-6 max-w-3xl">{renderSection()}</div>
      </main>
    </div>
  );
}
