import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiUserPlus, FiCheckSquare, FiCalendar, FiAward, FiEye, FiArrowLeft, FiChevronRight, FiBarChart2 } from 'react-icons/fi';
import * as api from '../api';

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white border border-[#E5E7EB] rounded-t-[16px] sm:rounded-[16px] w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-soft-lg animate-fade-up">
                <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB] sticky top-0 bg-white z-10 rounded-t-[16px]">
                    <h3 className="text-gray-800 font-display font-semibold text-base">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">X</button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

// ==================== STUDENTS PANEL ====================
export function StudentsPanel() {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState(['JEE Mains', 'NEET']);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [form, setForm] = useState({ userId: '', password: '', name: '', batch: '', course: '' });

    useEffect(() => { loadStudents(); loadCourses(); }, []);
    const loadCourses = async () => {
        try { const res = await api.fetchCollegeInfo(); if (res.data?.courseOptions?.length > 0) setCourses(res.data.courseOptions); }
        catch (e) { console.error('Failed to load courses', e); }
    };
    const loadStudents = async () => {
        try { const res = await api.fetchStudents(); setStudents(res.data); }
        catch { toast.error('Failed to load students'); }
        finally { setLoading(false); }
    };
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.createStudent(form);
            toast.success('Student created!');
            setModal(false); setForm({ userId: '', password: '', name: '', batch: '', course: '' }); loadStudents();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };
    const handleDelete = async (studentId) => {
        if (!window.confirm('Delete this student and all their data?')) return;
        try { await api.deleteStudent(studentId); toast.success('Deleted'); loadStudents(); setDetail(null); }
        catch { toast.error('Delete failed'); }
    };
    const openDetail = async (studentId) => {
        setDetailLoading(true);
        try { const res = await api.fetchStudentDetail(studentId); setDetail(res.data); }
        catch { toast.error('Failed to load student detail'); }
        finally { setDetailLoading(false); }
    };

    if (detail) return (
        <div>
            <button onClick={() => setDetail(null)} className="flex items-center gap-1 text-[#27548A] text-sm font-body font-medium mb-4 hover:underline"><FiArrowLeft size={14} /> Back to Students</button>
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6 mb-4">
                <h3 className="font-display font-bold text-xl text-gray-800 mb-1">{detail.profile?.name}</h3>
                <p className="text-gray-400 text-sm font-sans">ID: {detail.profile?.studentId} | {detail.profile?.course} | Batch {detail.profile?.batch}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                    <div className="bg-[#E8EEF5] rounded-[12px] p-3 text-center"><div className="text-2xl font-bold text-[#27548A]">{detail.overallAvg}%</div><div className="text-xs text-gray-500 mt-1">Overall Avg</div></div>
                    <div className="bg-[#D1FAE5] rounded-[12px] p-3 text-center"><div className="text-2xl font-bold text-[#059669]">{detail.attendancePercent}%</div><div className="text-xs text-gray-500 mt-1">Attendance</div></div>
                    <div className="bg-[#FEF3C7] rounded-[12px] p-3 text-center"><div className="text-2xl font-bold text-[#D97706]">{detail.presentDays}/{detail.totalDays}</div><div className="text-xs text-gray-500 mt-1">Present/Total</div></div>
                    <div className="bg-[#F3E8FF] rounded-[12px] p-3 text-center"><div className="text-2xl font-bold text-[#7C3AED]">{detail.testResults?.length || 0}</div><div className="text-xs text-gray-500 mt-1">Tests Taken</div></div>
                </div>
            </div>
            {detail.testResults?.length > 0 && (
                <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 mb-4">
                    <h4 className="font-display font-semibold text-gray-800 mb-3">Test Results</h4>
                    <div className="space-y-3">
                        {detail.testResults.map(t => (
                            <div key={t.testId} className="border border-[#E5E7EB] rounded-[12px] p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div><span className="font-body font-medium text-gray-800 text-sm">{t.testName}</span><span className="text-gray-400 text-xs ml-2">{new Date(t.date).toLocaleDateString('en-IN')}</span></div>
                                    <div className="flex items-center gap-2"><span className="text-sm font-bold text-[#27548A]">{t.percentage}%</span>{t.rank && <span className="text-xs bg-[#FEF3C7] text-[#D97706] px-2 py-0.5 rounded-full font-semibold">Rank #{t.rank}/{t.totalStudents}</span>}</div>
                                </div>
                                <div className="flex flex-wrap gap-2">{t.subjects?.map(s => <span key={s.subject} className="text-xs bg-[#F4F6FF] border border-[#E5E7EB] rounded-lg px-2 py-1 text-gray-600">{s.subject}: {s.marksObtained}/{s.totalMarks}</span>)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {detail.attendance?.length > 0 && (
                <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5">
                    <h4 className="font-display font-semibold text-gray-800 mb-3">Recent Attendance</h4>
                    <div className="flex flex-wrap gap-2">{detail.attendance.map(a => <span key={a._id} className={`text-xs px-2 py-1 rounded-full font-medium ${a.status === 'Present' ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>{new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>)}</div>
                </div>
            )}
        </div>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-gray-800 font-display font-semibold text-lg">Students</h2>
                <button onClick={() => setModal(true)} className="flex items-center gap-1.5 btn-primary text-sm py-2 px-4"><FiUserPlus size={14} /> Add Student</button>
            </div>
            {loading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div> :
                students.length === 0 ? <div className="text-center py-10 text-gray-400 font-sans">No students yet.</div> : (
                    <div className="space-y-3">
                        {students.map(s => (
                            <div key={s._id} className="bg-white rounded-[12px] border border-l-4 border-l-[#7ED6A7] border-[#E5E7EB] p-4 shadow-soft hover:shadow-soft-md transition-shadow cursor-pointer" onClick={() => openDetail(s.studentId)}>
                                <div className="flex items-center justify-between">
                                    <div><div className="text-gray-800 font-body font-medium text-sm">{s.name}</div><div className="text-gray-400 text-xs font-sans mt-0.5">ID: {s.studentId} | {s.course} | Batch {s.batch}</div></div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[#27548A] text-xs font-medium flex items-center gap-1"><FiChevronRight size={14} /></span>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(s.studentId); }} className="p-2 text-gray-400 hover:text-[#F28B82] transition-colors"><FiTrash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            {detailLoading && <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center"><div className="w-10 h-10 border-3 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div>}
            {modal && (
                <Modal title="Add New Student" onClose={() => setModal(false)}>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Student ID</label>
                            <input type="number" value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} placeholder="200001" className="input-field text-sm" required /></div>
                        <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Password</label>
                            <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Initial password" className="input-field text-sm" required /></div>
                        <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Full Name</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Student name" className="input-field text-sm" required /></div>
                        <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Batch</label>
                            <input type="text" value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} placeholder="2024-25" className="input-field text-sm" required /></div>
                        <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Course</label>
                            <select value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} className="input-field text-sm" required>
                                <option value="">Select Course</option>
                                {courses.map(c => <option key={c} value={c}>{c}</option>)}
                            </select></div>
                        <div className="flex gap-3 pt-2">
                            <button type="submit" className="btn-primary flex-1 text-sm">Create Student</button>
                            <button type="button" onClick={() => setModal(false)} className="btn-outline flex-1 text-sm">Cancel</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ==================== TEST MANAGEMENT PANEL ====================
export function TestManagementPanel() {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ testName: '', date: '', batch: '', subjects: [{ name: '', totalMarks: 100 }] });
    const [selectedTest, setSelectedTest] = useState(null);
    const [testDetail, setTestDetail] = useState(null);
    const [marksForm, setMarksForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadTests(); }, []);
    const loadTests = async () => {
        try { const res = await api.fetchTests(); setTests(res.data); }
        catch { toast.error('Failed to load tests'); }
        finally { setLoading(false); }
    };
    const handleCreate = async (e) => {
        e.preventDefault();
        const validSubjects = form.subjects.filter(s => s.name.trim());
        if (!validSubjects.length) { toast.error('Add at least one subject'); return; }
        try {
            await api.createTest({ ...form, subjects: validSubjects });
            toast.success('Test created!'); setModal(false);
            setForm({ testName: '', date: '', batch: '', subjects: [{ name: '', totalMarks: 100 }] }); loadTests();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Delete test and all marks?')) return;
        try { await api.deleteTest(id); toast.success('Deleted'); loadTests(); setSelectedTest(null); setTestDetail(null); }
        catch { toast.error('Failed'); }
    };
    const handlePublish = async (id) => {
        try { const res = await api.togglePublishTest(id); toast.success(res.data.isPublished ? 'Published!' : 'Unpublished'); loadTests(); }
        catch { toast.error('Failed'); }
    };
    const openTestDetail = async (testId) => {
        setSelectedTest(testId);
        try { const res = await api.fetchTestDetail(testId); setTestDetail(res.data); initMarksForm(res.data); }
        catch { toast.error('Failed to load test'); }
    };
    const initMarksForm = (data) => {
        const mf = {};
        data.students?.forEach(s => {
            mf[s.studentId] = {};
            data.test.subjects.forEach(sub => {
                const existing = s.subjects?.find(ss => ss.name === sub.name);
                mf[s.studentId][sub.name] = existing?.marksObtained ?? '';
            });
        });
        setMarksForm(mf);
    };
    const saveMarks = async () => {
        setSaving(true);
        const entries = [];
        Object.entries(marksForm).forEach(([studentId, subjects]) => {
            Object.entries(subjects).forEach(([subject, marks]) => {
                if (marks !== '' && marks !== null) entries.push({ studentId: parseInt(studentId), subject, marksObtained: Number(marks) });
            });
        });
        try { await api.submitMarksBulk(selectedTest, entries); toast.success('Marks saved!'); openTestDetail(selectedTest); }
        catch { toast.error('Failed to save marks'); }
        finally { setSaving(false); }
    };
    const addSubjectField = () => setForm(f => ({ ...f, subjects: [...f.subjects, { name: '', totalMarks: 100 }] }));
    const updateSubject = (i, key, val) => setForm(f => ({ ...f, subjects: f.subjects.map((s, idx) => idx === i ? { ...s, [key]: val } : s) }));
    const removeSubject = (i) => setForm(f => ({ ...f, subjects: f.subjects.filter((_, idx) => idx !== i) }));

    if (selectedTest && testDetail) return (
        <div>
            <button onClick={() => { setSelectedTest(null); setTestDetail(null); }} className="flex items-center gap-1 text-[#27548A] text-sm font-body font-medium mb-4 hover:underline"><FiArrowLeft size={14} /> Back to Tests</button>
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 mb-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-bold text-xl text-gray-800">{testDetail.test.testName}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${testDetail.test.isPublished ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-gray-100 text-gray-500'}`}>{testDetail.test.isPublished ? 'Published' : 'Draft'}</span>
                </div>
                <p className="text-gray-400 text-sm">{new Date(testDetail.test.date).toLocaleDateString('en-IN')} | Batch: {testDetail.test.batch} | Subjects: {testDetail.test.subjects.map(s => s.name).join(', ')}</p>
            </div>
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-display font-semibold text-gray-800">Enter Marks</h4>
                    <button onClick={saveMarks} disabled={saving} className="btn-primary text-sm py-2 px-4 disabled:opacity-60">{saving ? 'Saving...' : 'Save All Marks'}</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-[#E5E7EB]">
                            <th className="text-left py-2 px-2 text-gray-500 font-display font-semibold text-xs">Student</th>
                            {testDetail.test.subjects.map(s => <th key={s.name} className="text-center py-2 px-2 text-gray-500 font-display font-semibold text-xs">{s.name} ({s.totalMarks})</th>)}
                            <th className="text-center py-2 px-2 text-gray-500 font-display font-semibold text-xs">Total</th>
                            <th className="text-center py-2 px-2 text-gray-500 font-display font-semibold text-xs">%</th>
                            <th className="text-center py-2 px-2 text-gray-500 font-display font-semibold text-xs">Rank</th>
                        </tr></thead>
                        <tbody>
                            {testDetail.students?.map(s => (
                                <tr key={s.studentId} className="border-b border-[#F3F4F6]">
                                    <td className="py-2 px-2"><div className="text-gray-800 font-medium">{s.name}</div><div className="text-gray-400 text-xs">{s.studentId}</div></td>
                                    {testDetail.test.subjects.map(sub => (
                                        <td key={sub.name} className="py-2 px-2 text-center">
                                            <input type="number" min="0" max={sub.totalMarks} value={marksForm[s.studentId]?.[sub.name] ?? ''} onChange={e => setMarksForm(prev => ({ ...prev, [s.studentId]: { ...prev[s.studentId], [sub.name]: e.target.value } }))}
                                                className="w-16 text-center border border-[#E5E7EB] rounded-lg px-2 py-1 text-sm focus:border-[#27548A] focus:outline-none" placeholder="-" />
                                        </td>
                                    ))}
                                    <td className="py-2 px-2 text-center font-semibold text-gray-700">{s.hasMarks ? `${s.totalObtained}/${s.totalMax}` : '-'}</td>
                                    <td className="py-2 px-2 text-center"><span className={`font-semibold ${s.percentage >= 80 ? 'text-[#059669]' : s.percentage >= 50 ? 'text-[#D97706]' : 'text-[#DC2626]'}`}>{s.hasMarks ? `${s.percentage}%` : '-'}</span></td>
                                    <td className="py-2 px-2 text-center">{s.rank ? <span className="bg-[#FEF3C7] text-[#D97706] px-2 py-0.5 rounded-full text-xs font-semibold">#{s.rank}</span> : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-gray-800 font-display font-semibold text-lg">Test Management</h2>
                <button onClick={() => setModal(true)} className="flex items-center gap-1.5 btn-primary text-sm py-2 px-4"><FiPlus size={14} /> Create Test</button>
            </div>
            {loading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div> :
                tests.length === 0 ? <div className="text-center py-10 text-gray-400 font-sans">No tests yet.</div> : (
                    <div className="space-y-3">
                        {tests.map(t => (
                            <div key={t._id} className="bg-white rounded-[12px] border border-l-4 border-l-[#27548A] border-[#E5E7EB] p-4 shadow-soft hover:shadow-soft-md transition-shadow cursor-pointer" onClick={() => openTestDetail(t._id)}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-gray-800 font-body font-medium text-sm">{t.testName}</div>
                                        <div className="text-gray-400 text-xs font-sans mt-0.5">{new Date(t.date).toLocaleDateString('en-IN')} | Batch: {t.batch} | {t.subjects?.length} subjects | {t.marksEnteredCount || 0} students scored</div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); handlePublish(t._id); }} className={`p-2 transition-colors ${t.isPublished ? 'text-[#059669]' : 'text-gray-400 hover:text-[#059669]'}`} title={t.isPublished ? 'Unpublish' : 'Publish'}><FiEye size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(t._id); }} className="p-2 text-gray-400 hover:text-[#F28B82] transition-colors"><FiTrash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            {modal && (
                <Modal title="Create New Test" onClose={() => setModal(false)}>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Test Name</label>
                            <input type="text" value={form.testName} onChange={e => setForm({ ...form, testName: e.target.value })} placeholder="Mid Term Exam" className="input-field text-sm" required /></div>
                        <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Date</label>
                            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field text-sm" required /></div>
                        <div><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Batch</label>
                            <input type="text" value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} placeholder="2024-25" className="input-field text-sm" required /></div>
                        <div>
                            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Subjects</label>
                            {form.subjects.map((s, i) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <input type="text" value={s.name} onChange={e => updateSubject(i, 'name', e.target.value)} placeholder="Subject name" className="input-field text-sm flex-1" />
                                    <input type="number" value={s.totalMarks} onChange={e => updateSubject(i, 'totalMarks', e.target.value)} placeholder="100" className="input-field text-sm w-20" />
                                    {form.subjects.length > 1 && <button type="button" onClick={() => removeSubject(i)} className="text-[#F28B82] hover:text-[#DC2626] p-2"><FiTrash2 size={14} /></button>}
                                </div>
                            ))}
                            <button type="button" onClick={addSubjectField} className="text-[#27548A] text-xs font-medium hover:underline">+ Add Subject</button>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="submit" className="btn-primary flex-1 text-sm">Create Test</button>
                            <button type="button" onClick={() => setModal(false)} className="btn-outline flex-1 text-sm">Cancel</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ==================== BATCH ATTENDANCE PANEL ====================
export function BatchAttendancePanel() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [batch, setBatch] = useState('');
    const [students, setStudents] = useState([]);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadAttendance = async () => {
        if (!batch) return;
        setLoading(true);
        try {
            const res = await api.fetchAttendanceByDate(date, batch);
            setRecords(res.data.records || []);
            if (!res.data.records?.length) {
                const studRes = await api.fetchStudents(batch);
                setStudents(studRes.data);
                setRecords(studRes.data.map(s => ({ studentId: s.studentId, name: s.name, status: null })));
            }
        } catch { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };
    useEffect(() => { if (batch) loadAttendance(); }, [date, batch]);

    const toggleStatus = (studentId) => {
        setRecords(prev => prev.map(r => r.studentId === studentId ? { ...r, status: r.status === 'Present' ? 'Absent' : 'Present' } : r));
    };
    const markAll = (status) => setRecords(prev => prev.map(r => ({ ...r, status })));
    const saveAttendance = async () => {
        const validRecords = records.filter(r => r.status);
        if (!validRecords.length) { toast.error('Mark attendance first'); return; }
        setSaving(true);
        try {
            await api.recordBatchAttendance({ date, batch, records: validRecords.map(r => ({ studentId: r.studentId, status: r.status })) });
            toast.success('Attendance saved!');
        } catch { toast.error('Failed to save'); }
        finally { setSaving(false); }
    };

    const presentCount = records.filter(r => r.status === 'Present').length;
    const absentCount = records.filter(r => r.status === 'Absent').length;

    return (
        <div>
            <h2 className="text-gray-800 font-display font-semibold text-lg mb-5">Batch Attendance</h2>
            <div className="flex flex-wrap gap-3 mb-5">
                <div className="flex-1 min-w-[140px]"><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field text-sm" /></div>
                <div className="flex-1 min-w-[140px]"><label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Batch</label>
                    <input type="text" value={batch} onChange={e => setBatch(e.target.value)} placeholder="2024-25" className="input-field text-sm" /></div>
            </div>
            {loading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div> :
                records.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-4 text-sm font-sans">
                                <span className="text-[#059669] font-semibold">Present: {presentCount}</span>
                                <span className="text-[#DC2626] font-semibold">Absent: {absentCount}</span>
                                <span className="text-gray-400">Unmarked: {records.length - presentCount - absentCount}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => markAll('Present')} className="text-xs bg-[#D1FAE5] text-[#059669] px-3 py-1 rounded-full font-medium hover:bg-[#A7F3D0] transition-colors">All Present</button>
                                <button onClick={() => markAll('Absent')} className="text-xs bg-[#FEE2E2] text-[#DC2626] px-3 py-1 rounded-full font-medium hover:bg-[#FECACA] transition-colors">All Absent</button>
                            </div>
                        </div>
                        <div className="space-y-2 mb-4">
                            {records.map(r => (
                                <div key={r.studentId} onClick={() => toggleStatus(r.studentId)} className={`bg-white rounded-[12px] border p-3 shadow-soft flex items-center justify-between cursor-pointer transition-all ${r.status === 'Present' ? 'border-[#7ED6A7]' : r.status === 'Absent' ? 'border-[#F28B82]' : 'border-[#E5E7EB]'}`}>
                                    <div><div className="text-gray-800 font-body font-medium text-sm">{r.name}</div><div className="text-gray-400 text-xs">{r.studentId}</div></div>
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${r.status === 'Present' ? 'bg-[#D1FAE5] text-[#059669]' : r.status === 'Absent' ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-gray-100 text-gray-400'}`}>{r.status || 'Tap to mark'}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={saveAttendance} disabled={saving} className="btn-primary w-full disabled:opacity-60">{saving ? 'Saving...' : 'Save Attendance'}</button>
                    </div>
                )}
        </div>
    );
}

// ==================== ANALYTICS PANEL ====================
export function AnalyticsPanel() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.fetchAnalytics().then(r => setData(r.data)).catch(() => toast.error('Failed to load analytics')).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div>;
    if (!data) return <div className="text-center py-10 text-gray-400">No data available</div>;

    return (
        <div>
            <h2 className="text-gray-800 font-display font-semibold text-lg mb-5">Analytics Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-4 text-center"><div className="text-3xl font-bold text-[#27548A]">{data.totalStudents}</div><div className="text-gray-400 text-xs mt-1">Total Students</div></div>
                <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-4 text-center"><div className="text-3xl font-bold text-[#7ED6A7]">{data.totalTests}</div><div className="text-gray-400 text-xs mt-1">Published Tests</div></div>
                <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-4 text-center"><div className="text-3xl font-bold text-[#D97706]">{data.overallAttendance}%</div><div className="text-gray-400 text-xs mt-1">Overall Attendance</div></div>
                <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-4 text-center"><div className="text-3xl font-bold text-[#7C3AED]">{Object.keys(data.batchCounts || {}).length}</div><div className="text-gray-400 text-xs mt-1">Batches</div></div>
            </div>
            {data.topRankers?.length > 0 && (
                <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 mb-4">
                    <h3 className="font-display font-semibold text-gray-800 mb-3">Top Rankers {data.latestTest ? `- ${data.latestTest.name}` : ''}</h3>
                    <div className="space-y-2">
                        {data.topRankers.map(r => (
                            <div key={r.studentId} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${r.rank === 1 ? 'bg-[#FEF3C7] text-[#D97706]' : r.rank === 2 ? 'bg-gray-100 text-gray-600' : r.rank === 3 ? 'bg-[#FEE2E2] text-[#B45309]' : 'bg-[#F4F6FF] text-gray-500'}`}>#{r.rank}</span>
                                    <div><div className="text-gray-800 text-sm font-medium">{r.name}</div><div className="text-gray-400 text-xs">ID: {r.studentId}</div></div>
                                </div>
                                <div className="text-right"><div className="text-sm font-bold text-[#27548A]">{r.percentage}%</div><div className="text-gray-400 text-xs">{r.total}/{r.max}</div></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {data.subjectAverages?.length > 0 && (
                <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 mb-4">
                    <h3 className="font-display font-semibold text-gray-800 mb-3">Subject Averages</h3>
                    <div className="space-y-3">
                        {data.subjectAverages.map(s => (
                            <div key={s.subject}><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{s.subject}</span><span className="font-semibold text-[#27548A]">{s.average}%</span></div>
                                <div className="w-full bg-[#F3F4F6] rounded-full h-2"><div className="bg-[#27548A] h-2 rounded-full transition-all" style={{ width: `${s.average}%` }} /></div></div>
                        ))}
                    </div>
                </div>
            )}
            {Object.keys(data.batchCounts || {}).length > 0 && (
                <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5">
                    <h3 className="font-display font-semibold text-gray-800 mb-3">Batch Distribution</h3>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(data.batchCounts).map(([batch, count]) => (
                            <div key={batch} className="bg-[#E8EEF5] rounded-[12px] px-4 py-2 text-center"><div className="text-lg font-bold text-[#27548A]">{count}</div><div className="text-xs text-gray-500">{batch}</div></div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
