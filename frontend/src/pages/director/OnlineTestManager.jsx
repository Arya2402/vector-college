import React, { useState, useEffect } from 'react';
import * as api from '../../api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2, FiClock, FiVideo, FiImage } from 'react-icons/fi';
import 'katex/dist/katex.min.css';
import { MathRenderer } from '../../components/CBT/MathRenderer';

function Modal({ title, onClose, children, wide }) {
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className={`bg-white rounded-2xl w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} max-h-[90vh] flex flex-col shadow-xl`}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h3 className="text-gray-900 font-display font-semibold text-lg">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">&times;</button>
                </div>
                <div className="p-5 overflow-y-auto flex-1">{children}</div>
            </div>
        </div>
    );
}

// ----------------------------------------------------
// BUILDER FORM COMPONENT
// ----------------------------------------------------
function TestBuilderForm({ initialData, onClose, onSaved }) {
    const [form, setForm] = useState(initialData || {
        title: '', description: '', batch: '', password: '', durationMinutes: 60,
        maxAttempts: 1, positiveMarks: 4, negativeMarks: 1, status: 'draft',
        questions: []
    });
    const [loading, setLoading] = useState(false);

    const addQuestion = () => {
        setForm(f => ({
            ...f,
            questions: [...f.questions, { text: '', imageUrl: '', options: ['', '', '', ''], correctOptionIndex: 0, subtopic: '' }]
        }));
    };

    const removeQuestion = (idx) => {
        setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));
    };

    const updateQuestion = (idx, field, value) => {
        setForm(f => ({
            ...f,
            questions: f.questions.map((q, i) => i === idx ? { ...q, [field]: value } : q)
        }));
    };

    const updateOption = (qIdx, oIdx, value) => {
        setForm(f => ({
            ...f,
            questions: f.questions.map((q, i) => i === qIdx ? { ...q, options: q.options.map((opt, j) => j === oIdx ? value : opt) } : q)
        }));
    };

    const handleImageUpload = async (qIdx, e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadToast = toast.loading('Uploading image...');
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await api.uploadQuestionImage(formData);
            updateQuestion(qIdx, 'imageUrl', res.data.imageUrl);
            toast.success('Image uploaded!', { id: uploadToast });
        } catch {
            toast.error('Failed to upload image. Ensure Cloudinary env vars are set.', { id: uploadToast });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData?._id) {
                await api.updateOnlineTest(initialData._id, form);
                toast.success('Test updated!');
            } else {
                await api.createOnlineTest(form);
                toast.success('Test created!');
            }
            onSaved();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save test');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Title</label>
                    <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field text-sm" required /></div>
                <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Batch</label>
                    <input type="text" value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} className="input-field text-sm" required /></div>
                <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Test Password</label>
                    <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field text-sm" required /></div>
                <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Duration (Min)</label>
                    <input type="number" min="1" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })} className="input-field text-sm" required /></div>
                <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">+ Marks per correct</label>
                    <input type="number" value={form.positiveMarks} onChange={e => setForm({ ...form, positiveMarks: Number(e.target.value) })} className="input-field text-sm" required /></div>
                <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">- Marks per wrong</label>
                    <input type="number" value={form.negativeMarks} onChange={e => setForm({ ...form, negativeMarks: Number(e.target.value) })} className="input-field text-sm" required /></div>
                <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field text-sm">
                        <option value="draft">Draft</option><option value="active">Active</option><option value="completed">Completed</option>
                    </select></div>
                <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Max Attempts</label>
                    <input type="number" min="1" value={form.maxAttempts} onChange={e => setForm({ ...form, maxAttempts: Number(e.target.value) })} className="input-field text-sm" required /></div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-3 border-t pt-4 border-gray-100">
                    <h4 className="font-display font-semibold text-gray-800">Questions ({form.questions.length}) <span className="text-xs text-gray-500 font-normal">Supports LaTeX e.g., $\int x dx$</span></h4>
                    <button type="button" onClick={addQuestion} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"><FiPlus size={12} /> Add Question</button>
                </div>

                <div className="space-y-4">
                    {form.questions.map((q, qIdx) => (
                        <div key={qIdx} className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-[#27548A] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">Q{qIdx + 1}</span>
                                <button type="button" onClick={() => removeQuestion(qIdx)} className="text-gray-400 hover:text-red-500"><FiTrash2 size={16} /></button>
                            </div>

                            <div className="space-y-3 mb-3">
                                <label className="block text-xs font-semibold text-gray-500 uppercase">Question Text</label>
                                <textarea value={q.text} onChange={e => updateQuestion(qIdx, 'text', e.target.value)} rows="3" className="input-field text-sm" placeholder="Question or LaTeX..." required />

                                <div className="p-3 bg-white border border-gray-100 rounded-lg text-sm max-h-32 overflow-y-auto">
                                    <span className="text-xs text-blue-500 font-semibold block mb-1">Preview LaTeX:</span>
                                    <MathRenderer content={q.text} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Subtopic Tag</label>
                                    <input type="text" value={q.subtopic} onChange={e => updateQuestion(qIdx, 'subtopic', e.target.value)} className="input-field text-sm" placeholder="e.g. Thermodynamics" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Image (Optional)</label>
                                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                                        <FiImage /> {q.imageUrl ? 'Change Image' : 'Upload Image'}
                                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(qIdx, e)} />
                                    </label>
                                    {q.imageUrl && <div className="mt-2 relative inline-block"><img src={q.imageUrl} alt="Q" className="h-16 rounded border" /><button type="button" onClick={() => updateQuestion(qIdx, 'imageUrl', '')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><FiTrash2 size={12} /></button></div>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Options & Correct Answer</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-2 bg-white rounded-lg border p-1 border-gray-200">
                                            <input type="radio" name={`correct-${qIdx}`} checked={q.correctOptionIndex === oIdx} onChange={() => updateQuestion(qIdx, 'correctOptionIndex', oIdx)} className="ml-2 w-4 h-4 text-[#27548A]" required />
                                            <input type="text" value={opt} onChange={e => updateOption(qIdx, oIdx, e.target.value)} className="w-full bg-transparent border-none text-sm focus:outline-none p-1" placeholder={`Option ${oIdx + 1}`} required />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    {form.questions.length === 0 && <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed text-gray-400 text-sm">Add questions to your test.</div>}
                </div>
            </div>

            <div className="flex gap-3">
                <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : 'Save Test'}</button>
                <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            </div>
        </form>
    );
}

// ----------------------------------------------------
// LIVE MONITOR COMPONENT
// ----------------------------------------------------
function LiveMonitor({ test, onBack }) {
    const [attempts, setAttempts] = useState([]);

    useEffect(() => {
        const fetchAttempts = async () => {
            try {
                const res = await api.fetchLiveAttempts(test._id);
                setAttempts(res.data);
            } catch (err) {
                toast.error('Failed to load live tracking');
            }
        };
        fetchAttempts();
        const interval = setInterval(fetchAttempts, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, [test._id]);

    return (
        <div>
            <button onClick={onBack} className="text-sm font-medium text-[#27548A] mb-4 hover:underline">&larr; Back to Tests</button>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
                <h2 className="font-display font-bold text-xl text-gray-900 mb-1">Live Monitor: {test.title}</h2>
                <div className="flex gap-4 text-xs font-semibold">
                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded">Active: {attempts.filter(a => a.status === 'in-progress').length}</span>
                    <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">Submitted: {attempts.filter(a => a.status === 'submitted').length}</span>
                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded">Violations: {attempts.filter(a => a.status === 'auto-submitted-violation').length}</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-5 py-3">Student ID</th>
                            <th className="px-5 py-3">Attempt #</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3">Score</th>
                            <th className="px-5 py-3">Violations (OOS)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {attempts.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-gray-400">No attempts found.</td></tr>}
                        {attempts.map(a => (
                            <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-5 py-3 font-medium">{a.studentId}</td>
                                <td className="px-5 py-3">{a.attemptNumber} / {test.maxAttempts}</td>
                                <td className="px-5 py-3">
                                    {a.status === 'in-progress' && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold animate-pulse">Live</span>}
                                    {a.status === 'submitted' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">Done</span>}
                                    {a.status === 'auto-submitted-violation' && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">Anti-Cheat Triggered</span>}
                                </td>
                                <td className="px-5 py-3 font-bold text-gray-800">{a.status !== 'in-progress' ? a.score.totalMarks : '--'}</td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-1">
                                        <span className={`font-bold ${a.fullscreenExits >= 3 ? 'text-red-600' : a.fullscreenExits > 0 ? 'text-amber-500' : 'text-gray-400'}`}>{a.fullscreenExits} / 5 exits</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ----------------------------------------------------
// MAIN MANAGER
// ----------------------------------------------------
export default function OnlineTestManager() {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingTest, setEditingTest] = useState(null);
    const [monitoringTest, setMonitoringTest] = useState(null);

    const loadTests = async () => {
        try {
            const res = await api.fetchOnlineTests();
            setTests(res.data);
        } catch {
            toast.error('Failed to load tests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadTests(); }, []);

    const deleteTest = async (id) => {
        if (!window.confirm('Delete this CBT and all its attempts forever?')) return;
        try {
            await api.deleteOnlineTest(id);
            toast.success('Test deleted');
            loadTests();
        } catch {
            toast.error('Failed to delete');
        }
    }

    if (monitoringTest) {
        return <LiveMonitor test={monitoringTest} onBack={() => setMonitoringTest(null)} />
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-gray-900 font-display font-semibold text-lg">Computer Based Tests (CBT)</h2>
                <button onClick={() => setShowBuilder(true)} className="btn-primary text-xs py-2 px-3 flex items-center gap-1"><FiPlus size={14} /> Create Online Test</button>
            </div>

            {loading ? <div className="flex justify-center p-10"><div className="animate-spin w-8 h-8 rounded-full border-t-2 border-[#27548A]" /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tests.length === 0 && <div className="col-span-full text-center p-12 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">No active CBTs found. Create one above.</div>}
                    {tests.map(t => (
                        <div key={t._id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-soft-lg transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-display font-bold text-gray-800 text-base">{t.title}</h3>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-1">Batch: {t.batch}</p>
                                </div>
                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${t.status === 'active' ? 'bg-green-100 text-green-700' : t.status === 'draft' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>{t.status}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 my-4 text-center">
                                <div className="bg-gray-50 rounded-lg py-2">
                                    <FiClock className="mx-auto text-gray-400 mb-1" size={14} />
                                    <div className="text-xs font-semibold text-gray-700">{t.durationMinutes}m</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg py-2">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">+ / -</div>
                                    <div className="text-xs font-semibold text-gray-700">+{t.positiveMarks} / -{t.negativeMarks}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg py-2">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Max Try</div>
                                    <div className="text-xs font-semibold text-gray-700">{t.maxAttempts}</div>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 mb-4 h-4 overflow-hidden text-ellipsis whitespace-nowrap">Pass: <span className="font-mono bg-gray-100 p-1 rounded font-bold text-gray-800">{t.password}</span></p>

                            <div className="flex gap-2 border-t border-gray-100 pt-4 mt-auto">
                                <button onClick={() => setMonitoringTest(t)} className="flex-1 bg-amber-50 text-amber-700 font-semibold text-xs py-2 rounded-xl hover:bg-amber-100 transition-colors flex items-center justify-center gap-1"><FiVideo size={14} /> Live Monitor</button>
                                <button onClick={() => { setEditingTest(t); setShowBuilder(true); }} className="p-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"><FiEdit2 size={14} /></button>
                                <button onClick={() => deleteTest(t._id)} className="p-2 border border-gray-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors"><FiTrash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showBuilder && (
                <Modal title={editingTest ? 'Edit CBT' : 'Create CBT'} onClose={() => { setShowBuilder(false); setEditingTest(null); }} wide>
                    <TestBuilderForm initialData={editingTest} onClose={() => { setShowBuilder(false); setEditingTest(null); }} onSaved={() => { setShowBuilder(false); setEditingTest(null); loadTests(); }} />
                </Modal>
            )}
        </div>
    );
}
