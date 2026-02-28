// Force reload to clear Webpack ESLint cache
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    FiUsers, FiCalendar, FiBarChart2, FiLogOut, FiPlus, FiTrash2,
    FiArrowLeft, FiChevronRight, FiMenu, FiX, FiEye, FiCheckSquare, FiMonitor
} from 'react-icons/fi';
import * as api from '../api';
import {
    PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import OnlineTestManager from './director/OnlineTestManager';

// ==================== CATEGORY PRESETS ====================
const CATEGORY_PRESETS = {
    'JEE Mains': [
        { name: 'Mathematics', topics: ['Algebra', 'Calculus', 'Coordinate Geometry', 'Trigonometry', 'Probability', 'Vectors', 'Matrices'] },
        { name: 'Physics', topics: ['Mechanics', 'Thermodynamics', 'Electrodynamics', 'Optics', 'Modern Physics', 'Waves'] },
        { name: 'Chemistry', topics: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Coordination Compounds', 'Polymers'] },
    ],
    'NEET': [
        { name: 'Physics', topics: ['Mechanics', 'Thermodynamics', 'Optics', 'Modern Physics'] },
        { name: 'Chemistry', topics: ['Organic', 'Inorganic', 'Physical Chemistry'] },
        { name: 'Biology', topics: ['Botany', 'Zoology', 'Human Physiology', 'Genetics', 'Ecology'] },
    ],
    'General': [],
};

function Modal({ title, onClose, children, wide }) {
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className={`bg-white rounded-t-2xl sm:rounded-2xl w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} max-h-[90vh] overflow-y-auto shadow-xl`}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                    <h3 className="text-gray-900 font-display font-semibold text-base">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><FiX size={18} /></button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

// ==================== CREATE TEST FORM ====================
function CreateTestForm({ onClose, onCreated }) {
    const [form, setForm] = useState({
        testName: '', date: '', batch: '', category: 'JEE Mains',
        positiveMarks: 4, negativeMarks: 1,
        subjects: CATEGORY_PRESETS['JEE Mains'].map(s => ({ name: s.name, totalMarks: 100, totalQuestions: 25, topics: [], availableTopics: s.topics }))
    });

    const handleCategoryChange = (cat) => {
        const presets = CATEGORY_PRESETS[cat] || [];
        setForm(f => ({
            ...f, category: cat,
            subjects: presets.length > 0
                ? presets.map(s => ({ name: s.name, totalMarks: 100, totalQuestions: 25, topics: [], availableTopics: s.topics }))
                : [{ name: '', totalMarks: 100, totalQuestions: 25, topics: [], availableTopics: [] }]
        }));
    };

    const toggleTopic = (si, topic) => {
        setForm(f => ({
            ...f, subjects: f.subjects.map((s, i) => i === si ? {
                ...s, topics: s.topics.includes(topic) ? s.topics.filter(t => t !== topic) : [...s.topics, topic]
            } : s)
        }));
    };

    const updateSubject = (i, key, val) => setForm(f => ({ ...f, subjects: f.subjects.map((s, idx) => idx === i ? { ...s, [key]: val } : s) }));
    const addSubject = () => setForm(f => ({ ...f, subjects: [...f.subjects, { name: '', totalMarks: 100, totalQuestions: 25, topics: [], availableTopics: [] }] }));
    const removeSubject = (i) => setForm(f => ({ ...f, subjects: f.subjects.filter((_, idx) => idx !== i) }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validSubjects = form.subjects.filter(s => s.name.trim());
        if (!validSubjects.length) { toast.error('Add at least one subject'); return; }
        try {
            await api.createTest({ ...form, subjects: validSubjects.map(s => ({ name: s.name, totalMarks: Number(s.totalMarks), totalQuestions: Number(s.totalQuestions), topics: s.topics })) });
            toast.success('Test created!');
            onCreated();
            onClose();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div><label className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1 block">Test Name</label>
                    <input type="text" value={form.testName} onChange={e => setForm({ ...form, testName: e.target.value })} placeholder="Weekly Test 1" className="input-field text-sm" required /></div>
                <div><label className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1 block">Date</label>
                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field text-sm" required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1 block">Batch</label>
                    <input type="text" value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} placeholder="2024-25" className="input-field text-sm" required /></div>
                <div><label className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1 block">Category</label>
                    <select value={form.category} onChange={e => handleCategoryChange(e.target.value)} className="input-field text-sm">
                        {Object.keys(CATEGORY_PRESETS).map(c => <option key={c}>{c}</option>)}
                    </select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1 block">Positive Marks</label>
                    <input type="number" value={form.positiveMarks} onChange={e => setForm({ ...form, positiveMarks: Number(e.target.value) })} className="input-field text-sm" /></div>
                <div><label className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1 block">Negative Marks</label>
                    <input type="number" value={form.negativeMarks} onChange={e => setForm({ ...form, negativeMarks: Number(e.target.value) })} className="input-field text-sm" /></div>
            </div>
            <div>
                <label className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-2 block">Subjects & Topics</label>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {form.subjects.map((s, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <div className="flex gap-2 mb-2">
                                <input type="text" value={s.name} onChange={e => updateSubject(i, 'name', e.target.value)} placeholder="Subject" className="input-field text-sm flex-1" />
                                <input type="number" value={s.totalMarks} onChange={e => updateSubject(i, 'totalMarks', e.target.value)} placeholder="Marks" className="input-field text-sm w-20" title="Total Marks" />
                                <input type="number" value={s.totalQuestions} onChange={e => updateSubject(i, 'totalQuestions', e.target.value)} placeholder="Qs" className="input-field text-sm w-16" title="Total Questions" />
                                {form.subjects.length > 1 && <button type="button" onClick={() => removeSubject(i)} className="text-[#F28B82] p-1"><FiTrash2 size={14} /></button>}
                            </div>
                            {s.availableTopics.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {s.availableTopics.map(topic => (
                                        <button key={topic} type="button" onClick={() => toggleTopic(i, topic)}
                                            className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${s.topics.includes(topic) ? 'bg-[#27548A] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#27548A] hover:text-[#27548A]'}`}>
                                            {topic}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addSubject} className="text-[#27548A] text-xs font-medium hover:underline mt-2 flex items-center gap-1"><FiPlus size={12} /> Add Subject</button>
            </div>
            <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1 text-sm">Create Test</button>
                <button type="button" onClick={onClose} className="btn-outline flex-1 text-sm">Cancel</button>
            </div>
        </form>
    );
}

// ==================== SCORE ENTRY TABLE ====================
function ScoreEntry({ testId, onBack }) {
    const [testDetail, setTestDetail] = useState(null);
    const [marksForm, setMarksForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const initForm = (data) => {
        const mf = {};
        data.students?.forEach(s => {
            mf[s.studentId] = {};
            data.test.subjects.forEach(sub => {
                const ex = s.subjects?.find(ss => ss.name === sub.name);
                mf[s.studentId][sub.name] = { correct: ex?.correctAnswers ?? '', wrong: ex?.wrongAnswers ?? '', unattempted: ex?.unattempted ?? '' };
            });
        });
        setMarksForm(mf);
    };

    const loadDetail = async () => {
        try { const res = await api.fetchTestDetail(testId); setTestDetail(res.data); initForm(res.data); }
        catch { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { loadDetail(); }, [testId]);
    const updateField = (sid, sub, field, val) => {
        setMarksForm(prev => ({ ...prev, [sid]: { ...prev[sid], [sub]: { ...prev[sid][sub], [field]: val } } }));
    };

    const saveMarks = async () => {
        setSaving(true);
        const entries = [];
        Object.entries(marksForm).forEach(([studentId, subjects]) => {
            Object.entries(subjects).forEach(([subject, vals]) => {
                const c = Number(vals.correct) || 0;
                const w = Number(vals.wrong) || 0;
                const u = Number(vals.unattempted) || 0;
                if (c || w || u) {
                    const subInfo = testDetail.test.subjects.find(s => s.name === subject);
                    const marks = c * (testDetail.test.positiveMarks || 4) - w * (testDetail.test.negativeMarks || 1);
                    entries.push({ studentId: parseInt(studentId), subject, marksObtained: marks, correctAnswers: c, wrongAnswers: w, unattempted: u, totalMarks: subInfo?.totalMarks || 100 });
                }
            });
        });
        try { await api.submitMarksBulk(testId, entries); toast.success('Scores saved!'); loadDetail(); }
        catch { toast.error('Failed'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div>;
    if (!testDetail) return null;
    const t = testDetail.test;

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-1 text-[#27548A] text-sm font-medium mb-4 hover:underline"><FiArrowLeft size={14} /> Back</button>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-bold text-lg text-gray-900">{t.testName}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${t.isPublished ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{t.isPublished ? 'Published' : 'Draft'}</span>
                </div>
                <p className="text-gray-400 text-xs">{t.category} | {new Date(t.date).toLocaleDateString('en-IN')} | Batch: {t.batch} | +{t.positiveMarks}/-{t.negativeMarks}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-display font-semibold text-gray-800 text-sm">Enter Student Scores</h4>
                    <button onClick={saveMarks} disabled={saving} className="btn-primary text-xs py-2 px-4 disabled:opacity-60">{saving ? 'Saving...' : 'Save All'}</button>
                </div>
                <div className="overflow-x-auto -mx-5 px-5">
                    <table className="w-full text-xs min-w-[700px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-2 px-1.5 text-gray-500 font-semibold">Student</th>
                                {t.subjects.map(s => (
                                    <th key={s.name} colSpan={3} className="text-center py-2 px-1 text-gray-500 font-semibold border-l border-gray-100">{s.name} ({s.totalQuestions}Q)</th>
                                ))}
                                <th className="text-center py-2 px-1.5 text-gray-500 font-semibold border-l border-gray-100">Total</th>
                                <th className="text-center py-2 px-1.5 text-gray-500 font-semibold">Acc%</th>
                                <th className="text-center py-2 px-1.5 text-gray-500 font-semibold">Rank</th>
                            </tr>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th></th>
                                {t.subjects.map(s => (
                                    <React.Fragment key={s.name + '-sub'}>
                                        <th className="text-center text-[9px] text-gray-400 py-1 border-l border-gray-100">C</th>
                                        <th className="text-center text-[9px] text-gray-400 py-1">W</th>
                                        <th className="text-center text-[9px] text-gray-400 py-1">U</th>
                                    </React.Fragment>
                                ))}
                                <th></th><th></th><th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {testDetail.students?.map(s => {
                                let totalMarks = 0;
                                let totalCorrect = 0;
                                let totalQuestions = 0;
                                t.subjects.forEach(sub => {
                                    const vals = marksForm[s.studentId]?.[sub.name] || {};
                                    const c = Number(vals.correct) || 0;
                                    const w = Number(vals.wrong) || 0;
                                    totalMarks += c * (t.positiveMarks || 4) - w * (t.negativeMarks || 1);
                                    totalCorrect += c;
                                    totalQuestions += sub.totalQuestions || 0;
                                });
                                const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
                                return (
                                    <tr key={s.studentId} className="border-b border-gray-50 hover:bg-blue-50/30">
                                        <td className="py-1.5 px-1.5"><div className="font-medium text-gray-800">{s.name}</div><div className="text-gray-400 text-[9px]">{s.studentId}</div></td>
                                        {t.subjects.map(sub => {
                                            const vals = marksForm[s.studentId]?.[sub.name] || {};
                                            return (
                                                <React.Fragment key={sub.name}>
                                                    <td className="py-1 px-0.5 border-l border-gray-100"><input type="number" min="0" value={vals.correct ?? ''} onChange={e => updateField(s.studentId, sub.name, 'correct', e.target.value)} className="w-10 text-center border border-gray-200 rounded py-0.5 text-xs focus:border-[#27548A] focus:outline-none" placeholder="-" /></td>
                                                    <td className="py-1 px-0.5"><input type="number" min="0" value={vals.wrong ?? ''} onChange={e => updateField(s.studentId, sub.name, 'wrong', e.target.value)} className="w-10 text-center border border-gray-200 rounded py-0.5 text-xs focus:border-[#F28B82] focus:outline-none" placeholder="-" /></td>
                                                    <td className="py-1 px-0.5"><input type="number" min="0" value={vals.unattempted ?? ''} onChange={e => updateField(s.studentId, sub.name, 'unattempted', e.target.value)} className="w-10 text-center border border-gray-200 rounded py-0.5 text-xs focus:border-gray-400 focus:outline-none" placeholder="-" /></td>
                                                </React.Fragment>
                                            );
                                        })}
                                        <td className="py-1.5 px-1.5 text-center font-bold text-gray-700 border-l border-gray-100">{totalMarks}</td>
                                        <td className="py-1.5 px-1.5 text-center"><span className={`font-semibold ${accuracy >= 70 ? 'text-green-600' : accuracy >= 40 ? 'text-amber-600' : 'text-red-500'}`}>{accuracy}%</span></td>
                                        <td className="py-1.5 px-1.5 text-center">{s.rank ? <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">#{s.rank}</span> : '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ==================== STUDENT ANALYSIS VIEW ====================
function StudentAnalysis({ student, onBack }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.fetchStudentDetail(student.studentId)
            .then(r => setData(r.data))
            .catch(() => toast.error('Failed to load'))
            .finally(() => setLoading(false));
    }, [student.studentId]);

    if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div>;
    if (!data) return null;

    const weakSubjects = (data.subjectAverages || []).filter(s => s.average < 50);

    // Pie chart data for attendance
    const attendancePie = [
        { name: 'Present', value: data.presentDays || 0 },
        { name: 'Absent', value: (data.totalDays || 0) - (data.presentDays || 0) },
    ];

    // Bar chart data for test performance
    const testBar = (data.testResults || []).slice().reverse().slice(-10).map(t => ({
        name: t.testName?.slice(0, 10) || 'Test',
        score: t.percentage || 0,
    }));

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-1 text-[#27548A] text-sm font-medium mb-4 hover:underline"><FiArrowLeft size={14} /> Back to Students</button>

            {/* Profile Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-display font-bold text-xl text-gray-900">{data.profile?.name}</h3>
                        <p className="text-gray-400 text-xs mt-0.5">ID: {data.profile?.studentId} | {data.profile?.course} | Batch {data.profile?.batch}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${data.attendancePercent >= 75 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {data.attendancePercent >= 75 ? 'Good Standing' : 'Low Attendance'}
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-[#27548A]">{data.overallAvg}%</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Overall Avg</div>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${data.attendancePercent >= 75 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className={`text-2xl font-bold ${data.attendancePercent >= 75 ? 'text-green-600' : 'text-red-500'}`}>{data.attendancePercent}%</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Attendance</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-amber-600">{data.presentDays}/{data.totalDays}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Present/Total</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-purple-600">{data.testResults?.length || 0}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Tests Taken</div>
                    </div>
                </div>
            </div>

            {/* Weak subjects alert */}
            {weakSubjects.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
                    <h4 className="font-display font-semibold text-red-700 text-sm mb-2">⚠ Weak Subjects (Below 50%)</h4>
                    <div className="flex flex-wrap gap-2">
                        {weakSubjects.map(s => (
                            <span key={s.subject} className="text-xs bg-white text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-medium">
                                {s.subject}: {s.average}%
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Attendance Pie Chart */}
                {data.totalDays > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <h4 className="font-display font-semibold text-gray-800 text-sm mb-3">Attendance Overview</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={attendancePie} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                                    <Cell fill="#27548A" />
                                    <Cell fill="#F28B82" />
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Subject Performance Bar */}
                {data.subjectAverages?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <h4 className="font-display font-semibold text-gray-800 text-sm mb-3">Subject-wise Average</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data.subjectAverages.map(s => ({ name: s.subject, avg: s.average }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                <Tooltip formatter={(v) => `${v}%`} />
                                <Bar dataKey="avg" name="Average %" radius={[4, 4, 0, 0]}>
                                    {data.subjectAverages.map((s, i) => (
                                        <Cell key={i} fill={s.average >= 70 ? '#27548A' : s.average >= 50 ? '#F7D774' : '#F28B82'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Test Performance over time */}
            {testBar.length > 1 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                    <h4 className="font-display font-semibold text-gray-800 text-sm mb-3">Test Performance Trend</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={testBar}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(v) => `${v}%`} />
                            <Bar dataKey="score" name="Score %" fill="#27548A" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Subject Performance Bars */}
            {data.subjectAverages?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                    <h4 className="font-display font-semibold text-gray-800 text-sm mb-3">Subject Performance</h4>
                    <div className="space-y-2.5">
                        {data.subjectAverages.map(s => (
                            <div key={s.subject}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-600 font-medium">{s.subject}</span>
                                    <span className={`font-bold ${s.average >= 70 ? 'text-green-600' : s.average >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{s.average}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className={`h-2 rounded-full transition-all duration-500 ${s.average >= 70 ? 'bg-[#27548A]' : s.average >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${s.average}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Test History */}
            {data.testResults?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                    <h4 className="font-display font-semibold text-gray-800 text-sm mb-3">Test History</h4>
                    <div className="space-y-2">
                        {data.testResults.map(t => (
                            <div key={t.testId} className="border border-gray-100 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div>
                                        <span className="font-medium text-gray-800 text-xs">{t.testName}</span>
                                        <span className="text-gray-400 text-[10px] ml-2">{new Date(t.date).toLocaleDateString('en-IN')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold ${t.percentage >= 70 ? 'text-green-600' : t.percentage >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{t.percentage}%</span>
                                        {t.rank && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">#{t.rank}</span>}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {t.subjects?.map(s => (
                                        <span key={s.subject} className="text-[10px] bg-gray-50 border border-gray-100 rounded-lg px-2 py-0.5 text-gray-600">
                                            {s.subject}: {s.marksObtained}/{s.totalMarks}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Attendance Calendar Dots */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h4 className="font-display font-semibold text-gray-800 text-sm mb-3">Attendance History</h4>
                {data.attendance?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {data.attendance.map(a => (
                            <span key={a._id} title={`${new Date(a.date).toLocaleDateString('en-IN')} — ${a.status}`}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-semibold cursor-default transition-all ${a.status === 'Present' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-500 border border-red-200'}`}>
                                {new Date(a.date).getDate()}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm">No attendance data recorded.</p>
                )}
            </div>
        </div>
    );
}

// ==================== MAIN DASHBOARD ====================
const sidebarItems = [
    { key: 'students', label: 'Students', icon: FiUsers },
    { key: 'tests', label: 'Offline Tests', icon: FiCalendar },
    { key: 'online-tests', label: 'Online Tests (CBT)', icon: FiMonitor },
    { key: 'attendance', label: 'Attendance', icon: FiCheckSquare },
    { key: 'analytics', label: 'Analytics', icon: FiBarChart2 },
];

export default function DirectorDashboard() {
    const [active, setActive] = useState('students');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [students, setStudents] = useState([]);
    const [tests, setTests] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedTest, setSelectedTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [createTestModal, setCreateTestModal] = useState(false);
    const [addStudentModal, setAddStudentModal] = useState(false);
    const [filter, setFilter] = useState('all');
    const [analytics, setAnalytics] = useState(null);
    const { logoutAcademic } = useAuth();
    const navigate = useNavigate();

    // Add Student Form State
    const [newStudent, setNewStudent] = useState({ userId: '', password: '', name: '', batch: '', course: 'MPC' });

    // Attendance State
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceBatch, setAttendanceBatch] = useState('');
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [savingAttendance, setSavingAttendance] = useState(false);

    useEffect(() => {
        Promise.allSettled([api.fetchStudents(), api.fetchTests(), api.fetchAnalytics()])
            .then(([s, t, a]) => {
                if (s.status === 'fulfilled') setStudents(s.value.data);
                if (t.status === 'fulfilled') setTests(t.value.data);
                if (a.status === 'fulfilled') setAnalytics(a.value.data);
            })
            .finally(() => setLoading(false));
    }, []);

    const refreshTests = async () => {
        try { const r = await api.fetchTests(); setTests(r.data); } catch { }
    };
    const refreshAll = async () => {
        try {
            const [s, t, a] = await Promise.allSettled([api.fetchStudents(), api.fetchTests(), api.fetchAnalytics()]);
            if (s.status === 'fulfilled') setStudents(s.value.data);
            if (t.status === 'fulfilled') setTests(t.value.data);
            if (a.status === 'fulfilled') setAnalytics(a.value.data);
        } catch { }
    };

    const refreshStudents = async () => {
        try { const r = await api.fetchStudents(); setStudents(r.data); } catch { }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            await api.createStudent(newStudent);
            toast.success('Student added successfully!');
            setAddStudentModal(false);
            setNewStudent({ userId: '', password: '', name: '', batch: '', course: 'MPC' });
            refreshStudents();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to add student'); }
    };

    const handleDeleteStudent = async (studentId, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this student? This will also remove their test scores and attendance.')) return;
        try { await api.deleteStudent(studentId); toast.success('Student deleted'); refreshStudents(); }
        catch { toast.error('Failed to delete student'); }
    };

    // Load attendance for selected date/batch
    useEffect(() => {
        if (active !== 'attendance' || !attendanceBatch) return;
        api.fetchAttendanceByDate(attendanceDate, attendanceBatch).then(res => {
            const map = {};
            // Fix: the backend returns { date, records: [...] }
            const recordsArray = Array.isArray(res.data) ? res.data : (res.data.records || []);
            recordsArray.forEach(r => map[r.studentId] = r.status);
            setAttendanceRecords(map);
        }).catch(() => toast.error('Failed to load attendance'));
    }, [active, attendanceDate, attendanceBatch]);

    const handleSaveAttendance = async () => {
        setSavingAttendance(true);
        const records = Object.entries(attendanceRecords).map(([id, status]) => ({ studentId: parseInt(id), status }));
        try {
            await api.recordBatchAttendance({ date: attendanceDate, batch: attendanceBatch, records });
            toast.success('Attendance saved!');
            refreshAll();
        } catch { toast.error('Failed to save attendance'); }
        finally { setSavingAttendance(false); }
    };
    const handlePublish = async (id) => {
        try { await api.togglePublishTest(id); toast.success('Updated'); refreshTests(); }
        catch { toast.error('Failed'); }
    };
    const handleDeleteTest = async (id) => {
        if (!window.confirm('Delete test?')) return;
        try { await api.deleteTest(id); toast.success('Deleted'); refreshTests(); }
        catch { toast.error('Failed'); }
    };
    const handleLogout = () => { logoutAcademic(); navigate('/directors-batch/admin-login'); toast.success('Logged out'); };

    // Filter students
    const getFilteredStudents = () => {
        if (!analytics?.topRankers || filter === 'all') return students;
        const rankerIds = new Set(analytics.topRankers.map(r => r.studentId));
        if (filter === 'top10') return students.filter(s => rankerIds.has(s.studentId)).slice(0, 10);
        if (filter === 'bottom10') return [...students].reverse().slice(0, 10);
        return students;
    };

    const renderContent = () => {
        if (selectedStudent) return <StudentAnalysis student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
        if (selectedTest) return <ScoreEntry testId={selectedTest} onBack={() => { setSelectedTest(null); refreshAll(); }} />;

        switch (active) {
            case 'students':
                const filteredStudents = getFilteredStudents();
                return (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-gray-900 font-display font-semibold text-lg">Students ({filteredStudents.length})</h2>
                            <div className="flex items-center gap-2">
                                <select value={filter} onChange={e => setFilter(e.target.value)} className="input-field text-xs py-1.5 px-3 w-auto">
                                    <option value="all">All Students</option>
                                    <option value="top10">Top 10</option>
                                    <option value="bottom10">Bottom 10</option>
                                </select>
                                <button onClick={() => setAddStudentModal(true)} className="flex items-center gap-1 btn-primary text-xs py-1.5 px-3"><FiPlus size={12} /> Add Student</button>
                            </div>
                        </div>
                        {loading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div> : (
                            <div className="space-y-2">
                                {filteredStudents.map(s => (
                                    <div key={s._id} onClick={() => setSelectedStudent(s)} className="bg-white rounded-xl border border-gray-100 p-3.5 hover:border-[#27548A]/30 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between">
                                        <div><div className="text-gray-800 font-medium text-sm">{s.name}</div><div className="text-gray-400 text-[10px]">ID: {s.studentId} | {s.course} | Batch {s.batch}</div></div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={(e) => handleDeleteStudent(s.studentId, e)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors" title="Delete Student"><FiTrash2 size={14} /></button>
                                            <FiChevronRight size={14} className="text-gray-300" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'tests':
                return (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-gray-900 font-display font-semibold text-lg">Tests</h2>
                            <button onClick={() => setCreateTestModal(true)} className="flex items-center gap-1 btn-primary text-xs py-2 px-3"><FiPlus size={12} /> Create Test</button>
                        </div>
                        {tests.length === 0 ? <div className="text-center py-10 text-gray-400 text-sm">No tests yet.</div> : (
                            <div className="space-y-2">
                                {tests.map(t => (
                                    <div key={t._id} className="bg-white rounded-xl border border-gray-100 p-3.5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-gray-800 font-medium text-sm">{t.testName}</span>
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{t.category}</span>
                                                </div>
                                                <div className="text-gray-400 text-[10px]">{new Date(t.date).toLocaleDateString('en-IN')} | Batch {t.batch} | +{t.positiveMarks}/-{t.negativeMarks} | {t.subjects?.length} subjects</div>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                                <button onClick={() => setSelectedTest(t._id)} className="text-[#27548A] text-[10px] font-semibold bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors">Scores</button>
                                                <button onClick={() => handlePublish(t._id)} className={`p-1.5 rounded-lg transition-colors ${t.isPublished ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`} title={t.isPublished ? 'Unpublish' : 'Publish'}><FiEye size={13} /></button>
                                                <button onClick={() => handleDeleteTest(t._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 size={13} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'online-tests':
                return (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-4 min-h-[70vh]">
                        <OnlineTestManager />
                    </div>
                );
            case 'attendance':
                const batchStudents = students.filter(s => s.batch === attendanceBatch);
                const uniqueBatches = [...new Set(students.map(s => s.batch))];
                return (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-gray-900 font-display font-semibold text-lg">Batch Attendance</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => {
                                    const newMap = { ...attendanceRecords };
                                    batchStudents.forEach(s => newMap[s.studentId] = 'Present');
                                    setAttendanceRecords(newMap);
                                }} disabled={!attendanceBatch || batchStudents.length === 0} className="text-xs py-1.5 px-3 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 disabled:opacity-50">All P</button>

                                <button onClick={() => {
                                    const newMap = { ...attendanceRecords };
                                    batchStudents.forEach(s => newMap[s.studentId] = 'Absent');
                                    setAttendanceRecords(newMap);
                                }} disabled={!attendanceBatch || batchStudents.length === 0} className="text-xs py-1.5 px-3 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 disabled:opacity-50">All A</button>

                                <button onClick={() => {
                                    const newMap = { ...attendanceRecords };
                                    batchStudents.forEach(s => newMap[s.studentId] = 'Holiday');
                                    setAttendanceRecords(newMap);
                                }} disabled={!attendanceBatch || batchStudents.length === 0} className="text-xs py-1.5 px-3 bg-yellow-50 text-yellow-700 font-bold rounded-lg hover:bg-yellow-100 disabled:opacity-50 border border-yellow-200 shadow-sm mr-2">All Holiday</button>

                                <button onClick={handleSaveAttendance} disabled={savingAttendance || !attendanceBatch || batchStudents.length === 0} className="btn-primary text-xs py-1.5 px-4 disabled:opacity-60 shadow-md">
                                    {savingAttendance ? 'Saving...' : 'Save Attendance'}
                                </button>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 flex gap-4">
                            <div className="flex-1">
                                <label className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1 block">Date</label>
                                <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="input-field text-sm" />
                            </div>
                            <div className="flex-1">
                                <label className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1 block">Batch</label>
                                <select value={attendanceBatch} onChange={e => setAttendanceBatch(e.target.value)} className="input-field text-sm">
                                    <option value="">Select Batch</option>
                                    {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>
                        {attendanceBatch ? (
                            batchStudents.length === 0 ? <div className="text-center py-5 text-gray-400 text-sm">No students in this batch.</div> : (
                                <div className="bg-white rounded-2xl border border-gray-100 p-0 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="text-left font-semibold text-gray-600 py-3 px-4 border-b border-gray-100">Student</th>
                                                <th className="text-center font-semibold text-gray-600 py-3 px-4 border-b border-gray-100">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {batchStudents.map(s => (
                                                <tr key={s.studentId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                                    <td className="py-2.5 px-4"><div className="font-medium text-gray-800">{s.name}</div><div className="text-[10px] text-gray-400">{s.studentId}</div></td>
                                                    <td className="py-2.5 px-4 text-center">
                                                        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
                                                            <button onClick={() => setAttendanceRecords(p => ({ ...p, [s.studentId]: 'Present' }))} className={`px-4 py-1.5 text-xs font-semibold transition-colors ${attendanceRecords[s.studentId] === 'Present' ? 'bg-[#D1FAE5] text-[#059669]' : 'text-gray-500 hover:bg-gray-50'}`}>Present</button>
                                                            <button onClick={() => setAttendanceRecords(p => ({ ...p, [s.studentId]: 'Absent' }))} className={`px-4 py-1.5 text-xs font-semibold border-l border-gray-200 transition-colors ${attendanceRecords[s.studentId] === 'Absent' ? 'bg-[#FEE2E2] text-[#DC2626]' : 'text-gray-500 hover:bg-gray-50'}`}>Absent</button>
                                                            <button onClick={() => setAttendanceRecords(p => ({ ...p, [s.studentId]: 'Holiday' }))} className={`px-4 py-1.5 text-xs font-semibold border-l border-gray-200 transition-colors ${attendanceRecords[s.studentId] === 'Holiday' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-500 hover:bg-gray-50'}`}>Holiday</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        ) : (
                            <div className="text-center py-10 text-gray-400 font-sans text-sm">Please select a batch to mark attendance.</div>
                        )}
                    </div>
                );
            case 'analytics':
                if (!analytics) return <div className="text-center py-10 text-gray-400 text-sm">No data yet.</div>;
                return (
                    <div>
                        <h2 className="text-gray-900 font-display font-semibold text-lg mb-4">Analytics</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                            <div className="bg-white rounded-xl border border-gray-100 p-3 text-center"><div className="text-2xl font-bold text-[#27548A]">{analytics.totalStudents}</div><div className="text-gray-400 text-[10px]">Students</div></div>
                            <div className="bg-white rounded-xl border border-gray-100 p-3 text-center"><div className="text-2xl font-bold text-green-600">{analytics.totalTests}</div><div className="text-gray-400 text-[10px]">Tests</div></div>
                            <div className="bg-white rounded-xl border border-gray-100 p-3 text-center"><div className="text-2xl font-bold text-amber-600">{analytics.overallAttendance}%</div><div className="text-gray-400 text-[10px]">Attendance</div></div>
                            <div className="bg-white rounded-xl border border-gray-100 p-3 text-center"><div className="text-2xl font-bold text-purple-600">{Object.keys(analytics.batchCounts || {}).length}</div><div className="text-gray-400 text-[10px]">Batches</div></div>
                        </div>
                        {analytics.topRankers?.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                                <h3 className="font-display font-semibold text-gray-800 text-sm mb-3">Top Rankers</h3>
                                <div className="space-y-2">
                                    {analytics.topRankers.map(r => (
                                        <div key={r.studentId} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                                            <div className="flex items-center gap-2.5">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${r.rank <= 3 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'}`}>#{r.rank}</span>
                                                <div><div className="text-gray-800 text-xs font-medium">{r.name}</div><div className="text-gray-400 text-[9px]">{r.studentId}</div></div>
                                            </div>
                                            <span className="text-xs font-bold text-[#27548A]">{r.percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {analytics.subjectAverages?.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                                <h3 className="font-display font-semibold text-gray-800 text-sm mb-3">Subject Averages</h3>
                                <div className="space-y-2.5">{analytics.subjectAverages.map(s => (
                                    <div key={s.subject}><div className="flex justify-between text-xs mb-1"><span className="text-gray-600">{s.subject}</span><span className="font-bold text-[#27548A]">{s.average}%</span></div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-[#27548A] h-1.5 rounded-full" style={{ width: `${s.average}%` }} /></div></div>
                                ))}</div>
                            </div>
                        )}
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F6FF] flex">
            {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
            <aside className={`fixed lg:static top-0 left-0 h-full z-50 w-56 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#27548A] rounded-xl flex items-center justify-center"><span className="text-white font-bold text-xs">V</span></div>
                            <div><div className="text-gray-800 font-semibold text-sm">Director</div><div className="text-gray-400 text-[10px]">Analysis Panel</div></div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400"><FiX size={18} /></button>
                    </div>
                </div>
                <nav className="flex-1 p-2.5 space-y-0.5">
                    {sidebarItems.map(s => {
                        const Icon = s.icon;
                        return <button key={s.key} onClick={() => { setActive(s.key); setSidebarOpen(false); setSelectedStudent(null); setSelectedTest(null); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${active === s.key ? 'bg-blue-50 text-[#27548A]' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <Icon size={15} />{s.label}
                        </button>;
                    })}
                </nav>
                <div className="p-2.5 border-t border-gray-100">
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all"><FiLogOut size={15} /> Logout</button>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto">
                <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400"><FiMenu size={20} /></button>
                    <h1 className="text-gray-800 font-semibold text-base">{selectedStudent ? `${selectedStudent.name}'s Analysis` : selectedTest ? 'Score Entry' : sidebarItems.find(s => s.key === active)?.label}</h1>
                </div>
                <div className="p-4 sm:p-5 max-w-4xl">{renderContent()}</div>
            </main>
            {createTestModal && <Modal title="Create Test" onClose={() => setCreateTestModal(false)} wide><CreateTestForm onClose={() => setCreateTestModal(false)} onCreated={refreshTests} /></Modal>}
            {addStudentModal && (
                <Modal title="Add Student" onClose={() => setAddStudentModal(false)}>
                    <form onSubmit={handleAddStudent} className="space-y-4">
                        <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 block">Full Name</label>
                            <input type="text" value={newStudent.name} onChange={e => setNewStudent(p => ({ ...p, name: e.target.value }))} className="input-field text-sm" required /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 block">Student ID (Numeric)</label>
                                <input type="number" value={newStudent.userId} onChange={e => setNewStudent(p => ({ ...p, userId: e.target.value }))} className="input-field text-sm" required /></div>
                            <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 block">Password</label>
                                <input type="password" value={newStudent.password} onChange={e => setNewStudent(p => ({ ...p, password: e.target.value }))} className="input-field text-sm" required /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 block">Batch/Year</label>
                                <input type="text" value={newStudent.batch} onChange={e => setNewStudent(p => ({ ...p, batch: e.target.value }))} placeholder="2024-25" className="input-field text-sm" required /></div>
                            <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 block">Course Name</label>
                                <input type="text" value={newStudent.course} onChange={e => setNewStudent(p => ({ ...p, course: e.target.value }))} placeholder="MPC" className="input-field text-sm" required /></div>
                        </div>
                        <button type="submit" className="btn-primary w-full text-sm mt-2">Create Student</button>
                    </form>
                </Modal>
            )}
        </div>
    );
}
