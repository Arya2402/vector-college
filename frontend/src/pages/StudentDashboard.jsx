import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiLogOut, FiHome, FiBarChart2, FiCalendar, FiCheckSquare, FiAward } from 'react-icons/fi';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchStudentDashboard, fetchStudentMarks, fetchStudentAttendance, fetchStudentTests } from '../api';

function StatCard({ icon: Icon, label, value, color, sub }) {
    return (
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-soft">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${color}`}><Icon size={18} className="text-white" /></div>
                {sub && <span className="text-xs text-gray-400 font-sans">{sub}</span>}
            </div>
            <div className="text-2xl font-bold text-gray-800 font-sans">{value}</div>
            <div className="text-gray-400 text-xs font-sans mt-1">{label}</div>
        </div>
    );
}

function DashboardView({ data }) {
    if (!data) return null;
    const weakSubjects = (data.subjectAverages || []).filter(s => s.average < 50);

    return (
        <div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="font-display font-bold text-xl text-gray-900">Welcome, {data.profile?.name}</h2>
                        <p className="text-gray-400 text-xs mt-0.5">ID: {data.profile?.studentId} | {data.profile?.course} | Batch {data.profile?.batch}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${data.attendancePercent >= 75 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {data.attendancePercent >= 75 ? 'Good Standing' : 'Low Attendance'}
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                    <StatCard icon={FiBarChart2} label="Overall Average" value={`${data.overallAvg}%`} color="bg-[#27548A]" sub={`${data.totalTests} tests`} />
                    <StatCard icon={FiCheckSquare} label="Attendance" value={`${data.attendancePercent}%`} color="bg-[#7ED6A7]" sub={`${data.presentDays}/${data.totalDays} days`} />
                    <StatCard icon={FiAward} label="Latest Rank" value={data.latestRank ? `#${data.latestRank}` : '-'} color="bg-[#F7D774]" sub={data.latestTotalStudents ? `of ${data.latestTotalStudents}` : ''} />
                    <StatCard icon={FiCalendar} label="Next Test" value={data.nextTest ? new Date(data.nextTest.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'None'} color="bg-[#F28B82]" sub={data.nextTest?.testName || ''} />
                </div>
            </div>

            {weakSubjects.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
                    <h4 className="font-display font-semibold text-red-700 text-sm mb-2">⚠ Weak Subjects Needs Attention (Below 50%)</h4>
                    <div className="flex flex-wrap gap-2">
                        {weakSubjects.map(s => (
                            <span key={s.subject} className="text-xs bg-white text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-medium">
                                {s.subject}: {s.average}%
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {data.subjectAverages?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                    <h4 className="font-display font-semibold text-gray-800 text-sm mb-4">Subject-wise Performance</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data.subjectAverages.map(s => ({ name: s.subject, avg: s.average }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                            <RechartsTooltip formatter={(v) => `${v}%`} cursor={{ fill: 'transparent' }} />
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
    );
}

function MarksView() {
    const [marks, setMarks] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { fetchStudentMarks().then(r => setMarks(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false)); }, []);
    if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div>;
    if (!marks.length) return <div className="text-center py-10 text-gray-400 font-sans">No test results published yet.</div>;
    const testBar = marks.slice().reverse().slice(-10).map(t => ({
        name: t.testName?.slice(0, 10) || 'Test',
        score: t.percentage || 0,
    }));

    return (
        <div>
            {testBar.length > 1 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                    <h4 className="font-display font-semibold text-gray-800 text-sm mb-3">Test Performance Trend</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={testBar}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                            <RechartsTooltip formatter={(v) => `${v}%`} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="score" name="Score %" fill="#27548A" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            <h2 className="font-display font-semibold text-gray-800 text-lg mb-4">Test History</h2>
            <div className="space-y-4">
                {marks.map(t => (
                    <div key={t.testId} className="bg-white rounded-2xl border border border-gray-100 p-5 hover:shadow-soft transition-all">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-3">
                            <div>
                                <div className="text-gray-800 font-display font-semibold">{t.testName}</div>
                                <div className="text-gray-400 text-[10px] mt-0.5">{new Date(t.date).toLocaleDateString('en-IN')}</div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-xl font-bold ${t.percentage >= 70 ? 'text-green-600' : t.percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{t.percentage}%</span>
                                {t.overallAccuracy !== undefined && <span className="text-[10px] text-gray-400 font-medium tracking-wide">Acc: {t.overallAccuracy}%</span>}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {t.subjects?.map(s => (
                                <span key={s.subject} className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-gray-600 font-medium shadow-sm">
                                    {s.subject}: <span className="font-bold text-gray-800">{s.marksObtained}</span>/{s.totalMarks}
                                    {s.accuracy !== undefined && <span className="ml-1 text-[10px] text-gray-400">({s.accuracy}%)</span>}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AttendanceView() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => { fetchStudentAttendance().then(r => setData(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false)); }, []);
    if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div>;
    if (!data) return <div className="text-center py-10 text-gray-400">No attendance data</div>;
    const attendancePie = [
        { name: 'Present', value: data.present || 0 },
        { name: 'Absent', value: data.absent || 0 },
    ];

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center justify-center">
                    <h4 className="font-display font-semibold text-gray-800 text-sm mb-2">Attendance Overview</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={attendancePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                                <Cell fill="#27548A" />
                                <Cell fill="#F28B82" />
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col justify-center gap-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                        <span className="text-gray-600 font-medium text-sm">Overall</span>
                        <span className="text-xl font-bold text-[#27548A]">{data.percentage}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                        <span className="text-gray-600 font-medium text-sm">Present Days</span>
                        <span className="text-xl font-bold text-green-600">{data.present}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                        <span className="text-gray-600 font-medium text-sm">Absent Days</span>
                        <span className="text-xl font-bold text-red-500">{data.absent}</span>
                    </div>
                </div>
            </div>

            {data.records?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h4 className="font-display font-semibold text-gray-800 text-sm mb-4">Calendar Map</h4>
                    <div className="flex flex-wrap gap-2">
                        {data.records.map(a => (
                            <span key={a._id} title={`${new Date(a.date).toLocaleDateString('en-IN')} — ${a.status}`}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-semibold cursor-default transition-all ${a.status === 'Present' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-500 border border-red-200'}`}>
                                {new Date(a.date).getDate()}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function TestsView() {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { fetchStudentTests().then(r => setTests(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false)); }, []);
    if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div>;
    if (!tests.length) return <div className="text-center py-10 text-gray-400 font-sans">No upcoming tests scheduled.</div>;
    return (
        <div>
            <h2 className="font-display font-semibold text-gray-800 text-lg mb-4">Upcoming Tests</h2>
            <div className="space-y-3">
                {tests.map(t => (
                    <div key={t._id} className="bg-white rounded-[16px] border border-l-4 border-l-[#F28B82] border-[#E5E7EB] p-5 shadow-soft">
                        <div className="flex items-start justify-between mb-2">
                            <div><div className="text-gray-800 font-display font-semibold">{t.testName}</div><div className="text-gray-400 text-xs mt-1">{new Date(t.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
                            <span className="text-xs bg-[#FEE2E2] text-[#DC2626] px-2.5 py-1 rounded-full font-semibold">{Math.ceil((new Date(t.date) - new Date()) / (1000 * 60 * 60 * 24))}d left</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">{t.subjects?.map(s => <span key={s.name} className="text-xs bg-[#E8EEF5] text-[#27548A] px-2.5 py-1 rounded-full font-medium">{s.name} ({s.totalMarks})</span>)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: FiHome },
    { key: 'marks', label: 'Results', icon: FiAward },
    { key: 'attendance', label: 'Attendance', icon: FiCheckSquare },
    { key: 'tests', label: 'Upcoming', icon: FiCalendar },
];

export default function StudentDashboard() {
    const [active, setActive] = useState('dashboard');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { logoutAcademic } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { fetchStudentDashboard().then(r => setData(r.data)).catch(() => toast.error('Failed to load dashboard')).finally(() => setLoading(false)); }, []);

    const handleLogout = () => { logoutAcademic(); navigate('/academic-login'); toast.success('Logged out'); };

    return (
        <div className="min-h-screen bg-[#F4F6FF]">
            <header className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB] px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#7ED6A7] rounded-[10px] flex items-center justify-center"><span className="text-white font-bold text-xs font-sans">V</span></div>
                        <span className="text-gray-800 font-display font-semibold text-sm">Student Portal</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-[#27548A] transition-colors"><FiHome size={18} /></button>
                        <button onClick={handleLogout} className="text-gray-400 hover:text-[#F28B82] transition-colors"><FiLogOut size={18} /></button>
                    </div>
                </div>
            </header>
            <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-24">
                {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div> : (
                    <>
                        {active === 'dashboard' && <DashboardView data={data} />}
                        {active === 'marks' && <MarksView />}
                        {active === 'attendance' && <AttendanceView />}
                        {active === 'tests' && <TestsView />}
                    </>
                )}
            </div>
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] z-30">
                <div className="max-w-3xl mx-auto flex">
                    {tabs.map(t => {
                        const Icon = t.icon;
                        return <button key={t.key} onClick={() => setActive(t.key)} className={`flex-1 flex flex-col items-center py-3 text-xs font-body font-medium transition-colors ${active === t.key ? 'text-[#27548A]' : 'text-gray-400 hover:text-gray-600'}`}><Icon size={18} className="mb-1" />{t.label}</button>;
                    })}
                </div>
            </nav>
        </div>
    );
}
