import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiLogOut, FiHome, FiBarChart2, FiCalendar, FiCheckSquare, FiAward, FiArrowLeft, FiChevronRight, FiMonitor, FiClock, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchStudentDashboard, fetchStudentMarks, fetchStudentAttendance, fetchStudentTests, fetchStudentTestDetail, fetchOnlineTests, startOnlineTest } from '../api';
import TestRunner from '../components/CBT/TestRunner';
import { MathRenderer } from '../components/CBT/MathRenderer';

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
                    <StatCard icon={FiCalendar} label="Next Exam" value={data.nextTest ? new Date(data.nextTest.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'None'} color="bg-[#F28B82]" sub={data.nextTest?.testName || ''} />
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

// ==================== TEST DETAIL VIEW ====================
function TestDetailView({ testId, onBack }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedSubject, setExpandedSubject] = useState(null);

    useEffect(() => {
        fetchStudentTestDetail(testId)
            .then(r => setData(r.data))
            .catch(() => toast.error('Failed to load test details'))
            .finally(() => setLoading(false));
    }, [testId]);

    if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div>;
    if (!data) return <div className="text-center py-10 text-gray-400">Could not load test details.</div>;

    const { test, subjects, myTotal, myMax, myPercentage, myRank, totalStudents, rankings } = data;

    return (
        <div>
            {/* Header with back button */}
            <button onClick={onBack} className="flex items-center gap-2 text-[#27548A] font-medium text-sm mb-4 hover:underline">
                <FiArrowLeft size={16} /> Back to Results
            </button>

            {/* Test Overview Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h2 className="font-display font-bold text-lg text-gray-900">{test.testName}</h2>
                        <p className="text-gray-400 text-xs mt-1">
                            {new Date(test.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            {test.type === 'cbt' && <span className="ml-2 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[10px] font-bold uppercase tracking-wider">CBT EXAM</span>}
                            {test.type !== 'cbt' && test.category && <span className="ml-2 px-2 py-0.5 bg-blue-50 text-[#27548A] rounded-full text-[10px] font-semibold">{test.category}</span>}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${myPercentage >= 70 ? 'text-green-600' : myPercentage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{myPercentage}%</div>
                        <div className="text-gray-400 text-xs">{myTotal}/{myMax} marks</div>
                    </div>
                </div>
                <div className="flex gap-3 mt-3">
                    <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-[#27548A]">#{myRank || '-'}</div>
                        <div className="text-gray-400 text-[10px]">Rank of {totalStudents}</div>
                    </div>
                    <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-green-600">+{test.positiveMarks}</div>
                        <div className="text-gray-400 text-[10px]">Per Correct</div>
                    </div>
                    <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-red-500">-{test.negativeMarks}</div>
                        <div className="text-gray-400 text-[10px]">Per Wrong</div>
                    </div>
                </div>
            </div>

            {/* Subject-wise Breakdown */}
            <h3 className="font-display font-semibold text-gray-800 text-sm mb-3">Subject-wise Breakdown</h3>
            <div className="space-y-3 mb-6">
                {subjects.map(sub => {
                    const totalAttempted = sub.correctAnswers + sub.wrongAnswers;
                    const accuracy = totalAttempted > 0 ? Math.round((sub.correctAnswers / totalAttempted) * 1000) / 10 : 0;
                    const isExpanded = expandedSubject === sub.name;

                    return (
                        <div key={sub.name} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <button
                                onClick={() => setExpandedSubject(isExpanded ? null : sub.name)}
                                className="w-full p-4 text-left"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-display font-semibold text-gray-800">{sub.name}</span>
                                        <FiChevronRight size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                    </div>
                                    <span className={`text-lg font-bold ${sub.marksObtained !== null && (sub.marksObtained / sub.totalMarks * 100) >= 70 ? 'text-green-600' : (sub.marksObtained / sub.totalMarks * 100) >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                        {sub.marksObtained !== null ? sub.marksObtained : '-'}/{sub.totalMarks}
                                    </span>
                                </div>
                                {sub.marksObtained !== null && (
                                    <div className="flex gap-3 text-xs">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Correct: <b className="text-green-700">{sub.correctAnswers}</b></span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Wrong: <b className="text-red-600">{sub.wrongAnswers}</b></span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block"></span> Unattempted: <b className="text-gray-600">{sub.unattempted}</b></span>
                                        <span className="text-gray-400 ml-auto">Accuracy: <b className="text-[#27548A]">{accuracy}%</b></span>
                                    </div>
                                )}
                            </button>

                            {/* Topic Breakdown (Expanded) */}
                            {isExpanded && (
                                <div className="border-t border-gray-50 px-4 pb-4 pt-3 bg-gray-50/50">
                                    {sub.topicBreakdown && sub.topicBreakdown.length > 0 ? (
                                        <div>
                                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Topic-wise Analysis</h5>
                                            <div className="space-y-2">
                                                {sub.topicBreakdown.map((t, i) => {
                                                    const tTotal = t.correct + t.wrong + t.unattempted;
                                                    const tAcc = (t.correct + t.wrong) > 0 ? Math.round((t.correct / (t.correct + t.wrong)) * 100) : 0;
                                                    return (
                                                        <div key={i} className="bg-white rounded-xl p-3 border border-gray-100">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className="font-medium text-sm text-gray-800">{t.topic}</span>
                                                                <span className="text-xs text-gray-400">{tTotal} Q · {tAcc}% acc</span>
                                                            </div>
                                                            <div className="flex gap-4 text-xs">
                                                                <span className="text-green-600 font-medium">✓ {t.correct}</span>
                                                                <span className="text-red-500 font-medium">✗ {t.wrong}</span>
                                                                <span className="text-gray-400 font-medium">○ {t.unattempted}</span>
                                                            </div>
                                                            {/* Progress bar */}
                                                            {tTotal > 0 && (
                                                                <div className="flex rounded-full h-1.5 overflow-hidden mt-2 bg-gray-100">
                                                                    <div className="bg-green-500" style={{ width: `${(t.correct / tTotal) * 100}%` }}></div>
                                                                    <div className="bg-red-400" style={{ width: `${(t.wrong / tTotal) * 100}%` }}></div>
                                                                    <div className="bg-gray-300" style={{ width: `${(t.unattempted / tTotal) * 100}%` }}></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            {sub.topics && sub.topics.length > 0 ? (
                                                <div>
                                                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Topics Covered</h5>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {sub.topics.map((t, i) => (
                                                            <span key={i} className="text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full">{t}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-400 italic">No topic breakdown available for this subject.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Rankings Table */}
            {rankings && rankings.length > 0 && (
                <>
                    <h3 className="font-display font-semibold text-gray-800 text-sm mb-3">🏆 Test Rankings</h3>
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs">#</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs">Student</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-500 text-xs">Marks</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-500 text-xs">%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rankings.map(r => (
                                        <tr key={r.studentId} className={`border-b border-gray-50 transition-colors ${r.isMe ? 'bg-blue-50/70 font-semibold' : 'hover:bg-gray-50/50'}`}>
                                            <td className="py-2.5 px-4">
                                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${r.rank === 1 ? 'bg-[#F7D774] text-amber-800' :
                                                    r.rank === 2 ? 'bg-gray-200 text-gray-700' :
                                                        r.rank === 3 ? 'bg-orange-200 text-orange-800' :
                                                            'bg-gray-50 text-gray-500'
                                                    }`}>{r.rank}</span>
                                            </td>
                                            <td className="py-2.5 px-4">
                                                <span className={`${r.isMe ? 'text-[#27548A]' : 'text-gray-700'}`}>
                                                    {r.name}
                                                    {r.isMe && <span className="ml-1.5 text-[10px] bg-[#27548A] text-white px-1.5 py-0.5 rounded-full">You</span>}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-right text-gray-700">{r.totalMarks}/{r.maxMarks}</td>
                                            <td className="py-2.5 px-4 text-right">
                                                <span className={`font-bold ${r.percentage >= 70 ? 'text-green-600' : r.percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                                    {r.percentage}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Detailed Question Review (CBT only) */}
            {test.type === 'cbt' && test.questions && (
                <>
                    <h3 className="font-display font-semibold text-gray-800 text-sm mb-3">📝 Detailed Question Review</h3>
                    <div className="space-y-4 mb-20">
                        {test.questions.map((q, idx) => {
                            const studentAns = data.answers?.find(a => a.questionId === q._id);

                            let isCorrect = studentAns?.isCorrect;
                            if (isCorrect === undefined || isCorrect === null) {
                                if (q.type === 'Numerical') {
                                    isCorrect = studentAns?.numericalAnswer != null && Math.abs(Number(studentAns.numericalAnswer) - Number(q.correctNumericalAnswer)) < 0.001;
                                } else {
                                    isCorrect = studentAns?.selectedOptionIndex != null && studentAns.selectedOptionIndex === q.correctOptionIndex;
                                }
                            }
                            const isSkipped = (studentAns?.selectedOptionIndex === undefined || studentAns?.selectedOptionIndex === null) &&
                                (studentAns?.numericalAnswer === undefined || studentAns?.numericalAnswer === null);

                            return (
                                <div key={q._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                    <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-gray-400 bg-white border border-gray-200 w-6 h-6 rounded-lg flex items-center justify-center">Q{idx + 1}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-0.5 bg-gray-100 rounded-md">{q.subject}</span>
                                        </div>
                                        <div className="text-[10px] font-bold">
                                            {isCorrect ? (
                                                <span className="text-green-600 flex items-center gap-1"><FiCheck /> Correct (+{q.positiveMarks || 4})</span>
                                            ) : isSkipped ? (
                                                <span className="text-gray-400 flex items-center gap-1"><FiAlertCircle /> Unattempted (0)</span>
                                            ) : (
                                                <span className="text-red-600 flex items-center gap-1"><FiX /> Wrong (-{q.negativeMarks || 1})</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="text-gray-900 font-medium leading-relaxed mb-4">
                                            <MathRenderer content={q.text} />
                                        </div>

                                        {q.imageUrl && (
                                            <div className="mb-4">
                                                <img src={q.imageUrl} alt="Question" className="max-h-48 rounded-xl border border-gray-100 shadow-sm" />
                                            </div>
                                        )}

                                        {q.type === 'Numerical' ? (
                                            <div className="flex gap-4">
                                                <div className="flex-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    <div className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Your Answer</div>
                                                    <div className={`font-mono font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>{studentAns?.numericalAnswer ?? 'N/A'}</div>
                                                </div>
                                                <div className="flex-1 p-3 rounded-xl bg-green-50 border border-green-100">
                                                    <div className="text-[9px] uppercase font-bold text-green-600/60 mb-0.5">Correct Answer</div>
                                                    <div className="font-mono font-bold text-green-700">{q.correctNumericalAnswer}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                                {q.options.map((opt, oIdx) => {
                                                    const isSelected = studentAns?.selectedOptionIndex === oIdx;
                                                    const isCorrectOpt = q.correctOptionIndex === oIdx;

                                                    let style = 'bg-white border-gray-100 text-gray-600';
                                                    if (isSelected && isCorrectOpt) style = 'bg-green-500 border-green-600 text-white shadow-sm';
                                                    else if (isSelected) style = 'bg-red-500 border-red-600 text-white shadow-sm';
                                                    else if (isCorrectOpt) style = 'bg-green-50 border-green-200 text-green-700';

                                                    return (
                                                        <div key={oIdx} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${style}`}>
                                                            <span className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center shrink-0 text-xs font-bold uppercase">{String.fromCharCode(65 + oIdx)}</span>
                                                            <div className="text-xs font-medium"><MathRenderer content={opt} /></div>
                                                            {isSelected && isCorrectOpt && <FiCheck className="ml-auto" />}
                                                            {isSelected && !isCorrectOpt && <FiX className="ml-auto" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

function MarksView() {
    const [marks, setMarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTestId, setSelectedTestId] = useState(null);

    useEffect(() => { fetchStudentMarks().then(r => setMarks(r.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false)); }, []);

    if (selectedTestId) {
        return <TestDetailView testId={selectedTestId} onBack={() => setSelectedTestId(null)} />;
    }

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
                    <button
                        key={t.testId}
                        onClick={() => t.resultsPublished !== false && setSelectedTestId(t.testId)}
                        disabled={t.resultsPublished === false}
                        className={`w-full text-left bg-white rounded-2xl border border-gray-100 p-5 ${t.resultsPublished === false ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md hover:border-[#27548A]/30 transition-all group cursor-pointer'}`}
                    >
                        <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="text-gray-800 font-display font-semibold group-hover:text-[#27548A] transition-colors">{t.testName}</div>
                                    {t.type === 'cbt' && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 border border-purple-100 rounded text-[9px] font-bold tracking-widest uppercase">CBT</span>}
                                </div>
                                <div className="text-gray-400 text-[10px] mt-0.5">{new Date(t.date).toLocaleDateString('en-IN')}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col items-end gap-1">
                                    {t.resultsPublished === false ? (
                                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100 uppercase tracking-wider">Results Pending</span>
                                    ) : (
                                        <>
                                            <span className={`text-xl font-bold ${t.percentage >= 70 ? 'text-green-600' : t.percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{t.percentage}%</span>
                                            {t.rank && <span className="text-[10px] text-gray-400 font-medium">Rank #{t.rank} of {t.totalStudents}</span>}
                                        </>
                                    )}
                                </div>
                                {t.resultsPublished !== false && <FiChevronRight size={16} className="text-gray-300 group-hover:text-[#27548A] transition-colors" />}
                            </div>
                        </div>
                        {t.resultsPublished !== false && (
                            <div className="flex flex-wrap gap-2">
                                {t.subjects?.map(s => (
                                    <span key={s.subject} className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-gray-600 font-medium shadow-sm">
                                        {s.subject}: <span className="font-bold text-gray-800">{s.marksObtained}</span>/{s.totalMarks}
                                    </span>
                                ))}
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

function AttendanceView() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewDate, setViewDate] = useState(new Date());

    useEffect(() => {
        fetchStudentAttendance()
            .then(r => setData(r.data))
            .catch(() => toast.error('Failed to load attendance'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div>;
    if (!data) return <div className="text-center py-10 text-gray-400">No attendance data found.</div>;

    const attendancePie = [
        { name: 'Present', value: data.present || 0 },
        { name: 'Absent', value: data.absent || 0 },
        { name: 'Holiday', value: data.holiday || 0 },
    ];

    // Calendar logic
    const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const startDay = monthStart.getDay();
    const totalDays = monthEnd.getDate();

    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));

    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center justify-center">
                    <h4 className="font-display font-semibold text-gray-800 text-sm mb-2">Overall Overview</h4>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie data={attendancePie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                                <Cell fill="#7ED6A7" />
                                <Cell fill="#F28B82" />
                                <Cell fill="#F7D774" />
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center justify-center p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                        <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">Total %</span>
                        <span className="text-xl font-bold text-[#27548A]">{data.percentage}%</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-green-50/50 rounded-xl border border-green-100/50">
                        <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">Present</span>
                        <span className="text-xl font-bold text-green-600">{data.present}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-red-50/50 rounded-xl border border-red-100/50">
                        <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">Absent</span>
                        <span className="text-xl font-bold text-red-500">{data.absent}</span>
                    </div>
                    <div className="col-span-3 py-2 px-4 bg-gray-50 rounded-xl text-center text-xs font-semibold text-gray-400">
                        Attendance status helps in your internal assessment
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="font-display font-semibold text-gray-800 text-sm flex items-center gap-2">
                        <FiCalendar className="text-[#27548A]" /> Attendance Calendar
                    </h4>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-700 w-24 text-center">
                            {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <div className="flex gap-1">
                            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"><FiArrowLeft size={14} /></button>
                            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"><FiChevronRight size={14} /></button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest py-1">{day}</div>
                    ))}
                    {days.map((date, i) => {
                        if (!date) return <div key={`empty-${i}`} className="aspect-square opacity-0"></div>;

                        const record = data.records.find(r => new Date(r.date).toDateString() === date.toDateString());
                        let statusColor = 'bg-gray-50 text-gray-300 border-gray-100';
                        let symbol = '';

                        if (record) {
                            if (record.status === 'Present') {
                                statusColor = 'bg-[#E6F8EF] text-[#059669] border-[#B2EBD0]';
                                symbol = 'P';
                            } else if (record.status === 'Absent') {
                                statusColor = 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]';
                                symbol = 'A';
                            } else if (record.status === 'Holiday') {
                                statusColor = 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]';
                                symbol = 'H';
                            }
                        }

                        // Highlight today
                        const isToday = date.toDateString() === new Date().toDateString();

                        return (
                            <div key={i} title={date.toLocaleDateString('en-IN') + (record ? ` - ${record.status}` : '')}
                                className={`aspect-square rounded-xl border flex flex-col items-center justify-center transition-all relative ${statusColor} ${isToday ? 'ring-2 ring-[#27548A] ring-offset-1' : ''}`}>
                                <span className="text-[10px] font-bold">{date.getDate()}</span>
                                <span className="text-[8px] font-black">{symbol}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-center gap-6 mt-8 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-50 pt-5">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#E6F8EF] border border-[#B2EBD0] inline-block"></span> Present</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#FEE2E2] border border-[#FECACA] inline-block"></span> Absent</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#FFFBEB] border border-[#FEF3C7] inline-block"></span> Holiday</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-50 border border-gray-100 inline-block"></span> N/A</div>
                </div>
            </div>
        </div>
    );
}

// ==================== EXAMS / TESTS VIEW (COMBINED) ====================
function ExamsView({ onStartTest }) {
    const [offlineTests, setOfflineTests] = useState([]);
    const [onlineTests, setOnlineTests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Auth Prompt State for CBT
    const [passwordPrompt, setPasswordPrompt] = useState(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        Promise.allSettled([
            fetchStudentTests(),
            fetchOnlineTests()
        ]).then(([offlineRes, onlineRes]) => {
            if (offlineRes.status === 'fulfilled') setOfflineTests(offlineRes.value.data);
            if (onlineRes.status === 'fulfilled') setOnlineTests(onlineRes.value.data);
        }).finally(() => setLoading(false));
    }, []);

    const handleJoinClick = (test) => {
        setPasswordPrompt(test);
        setPasswordInput('');
    };

    const handleStartEvent = async (e) => {
        e.preventDefault();
        setStarting(true);
        try {
            // Attempt to enter fullscreen immediately on user gesture
            const el = document.documentElement;
            if (el.requestFullscreen) {
                el.requestFullscreen({ navigationUI: 'hide' }).catch(() => { });
            }

            const res = await startOnlineTest(passwordPrompt._id, { password: passwordInput });
            onStartTest(passwordPrompt._id, res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to start test');
        } finally {
            setStarting(false);
        }
    };

    if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-[#27548A] border-t-transparent rounded-full animate-spin" /></div>;

    const noTests = offlineTests.length === 0 && onlineTests.length === 0;

    return (
        <div>
            <h2 className="font-display font-semibold text-gray-800 text-lg mb-4">Upcoming & Live Exams</h2>

            {noTests ? (
                <div className="text-center py-10 text-gray-400 font-sans border border-dashed rounded-2xl">No upcoming exams scheduled.</div>
            ) : (
                <div className="grid gap-5">
                    {onlineTests.map(t => {
                        const now = new Date();
                        const start = t.startTime ? new Date(t.startTime) : null;
                        const end = t.endTime ? new Date(t.endTime) : null;

                        let statusLabel = t.status === 'active' ? '● LIVE NOW' : t.status === 'completed' ? 'COMPLETED' : 'DRAFT';
                        let isJoinable = t.status === 'active';

                        if (start && now < start) {
                            statusLabel = 'SCHEDULED';
                            isJoinable = false;
                        } else if (end && now > end) {
                            statusLabel = 'TIME EXPIRED';
                            isJoinable = false;
                        }

                        return (
                            <div key={t._id} className={`bg-white rounded-[16px] border border-l-4 ${isJoinable ? 'border-l-[#8B5CF6]' : 'border-l-gray-300'} border-[#E5E7EB] p-5 shadow-soft hover:shadow-md transition-shadow`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-gray-900 font-display font-semibold text-lg">{t.title}</h3>
                                            <span className="bg-purple-100 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">CBT</span>
                                        </div>
                                        <p className="text-gray-400 text-[10px] mt-1 uppercase tracking-widest font-semibold">Batch: {t.batch}</p>
                                    </div>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${isJoinable ? 'bg-green-50 text-green-700 border-green-200 animate-pulse' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                        {statusLabel}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1.5 mb-4 text-[11px] text-gray-500 font-medium">
                                    <div className="flex gap-4">
                                        <span className="flex items-center gap-1"><FiClock size={12} /> {t.durationMinutes} min</span>
                                        <span>+{t.positiveMarks} / -{t.negativeMarks} marks</span>
                                    </div>
                                    {start && <div>Starts: <span className="text-[#27548A]">{start.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>}
                                    {end && <div>Ends: <span className="text-[#27548A]">{end.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>}
                                </div>
                                <button
                                    onClick={() => handleJoinClick(t)}
                                    disabled={!isJoinable}
                                    className="btn-primary w-full py-2.5 text-sm font-bold shadow-md disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:shadow-none disabled:cursor-not-allowed"
                                >
                                    {isJoinable ? 'Join Computer Based Test' : 'Test Unavailable'}
                                </button>
                            </div>
                        );
                    })}

                    {/* Offline Scheduled Tests */}
                    {offlineTests.map(t => (
                        <div key={t._id} className="bg-white rounded-[16px] border border-l-4 border-l-[#F28B82] border-gray-100 p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-gray-800 font-display font-semibold text-lg">{t.testName}</div>
                                        <span className="bg-gray-100 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Offline</span>
                                    </div>
                                    <div className="text-gray-500 text-xs mt-1 font-medium flex items-center gap-1.5">
                                        <FiCalendar size={12} /> {new Date(t.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                                <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-full font-bold shadow-sm whitespace-nowrap">
                                    {Math.ceil((new Date(t.date) - new Date()) / (1000 * 60 * 60 * 24))} Days Left
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {t.subjects?.map(s => (
                                    <span key={s.name} className="text-[11px] bg-blue-50 border border-blue-100 text-[#27548A] px-2.5 py-1 rounded-full font-semibold shadow-sm">
                                        {s.name} <span className="opacity-70 font-medium">({s.totalMarks}m)</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {passwordPrompt && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100 transform transition-all">
                        <div className="w-12 h-12 bg-blue-50 text-[#27548A] rounded-xl flex items-center justify-center mb-4">
                            <FiMonitor size={24} />
                        </div>
                        <h3 className="font-display font-bold text-xl mb-1 text-gray-900">{passwordPrompt.title}</h3>
                        <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                            Please enter the secure test password to begin. <strong className="text-gray-700">Warning:</strong> Once started, you must remain in fullscreen mode. Exiting fullscreen 5 times will auto-submit your exam.
                        </p>
                        <form onSubmit={handleStartEvent}>
                            <div className="mb-5">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Test Password</label>
                                <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#27548A] focus:bg-white transition-colors" placeholder="••••••••" required autoFocus />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setPasswordPrompt(null)} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                                <button type="submit" disabled={starting} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-[#27548A] text-white shadow-md hover:bg-[#1f426d] transition-colors">{starting ? 'Joining...' : 'Start Test'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: FiHome },
    { key: 'marks', label: 'Results', icon: FiAward },
    { key: 'attendance', label: 'Attendance', icon: FiCheckSquare },
    { key: 'tests', label: 'Exams', icon: FiMonitor },
];

export default function StudentDashboard() {
    const [active, setActive] = useState('dashboard');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // CBT State
    const [activeTestId, setActiveTestId] = useState(null);
    const [activeAttemptData, setActiveAttemptData] = useState(null);

    const { logoutAcademic } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { fetchStudentDashboard().then(r => setData(r.data)).catch(() => toast.error('Failed to load dashboard')).finally(() => setLoading(false)); }, []);

    const handleLogout = () => { logoutAcademic(); navigate('/academic-login'); toast.success('Logged out'); };

    const handleStartCBT = (testId, attemptData) => {
        setActiveTestId(testId);
        setActiveAttemptData(attemptData);
    };

    const handleCBTFinish = () => {
        setActiveTestId(null);
        setActiveAttemptData(null);
        setActive('marks'); // Auto switch to marks/results tab when done
    };

    if (activeTestId && activeAttemptData) {
        return (
            <TestRunner
                key={`test-${activeTestId}-${activeAttemptData._id}`}
                testId={activeTestId}
                attemptData={activeAttemptData}
                onFinish={handleCBTFinish}
            />
        );
    }

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
                        {active === 'tests' && <ExamsView onStartTest={handleStartCBT} />}
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
