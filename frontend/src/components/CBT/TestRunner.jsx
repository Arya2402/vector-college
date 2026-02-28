import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../../api';
import toast from 'react-hot-toast';
import { FiClock, FiAlertTriangle, FiCheck, FiChevronRight, FiFlag } from 'react-icons/fi';
import 'katex/dist/katex.min.css';
import { MathRenderer } from './MathRenderer';

export default function TestRunner({ testId, attemptData, onFinish }) {
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);

    const [answers, setAnswers] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [fullscreenWarnings, setFullscreenWarnings] = useState(attemptData?.fullscreenExits || 0);
    const [isViolation, setIsViolation] = useState(false);
    const [isFullscreenActive, setIsFullscreenActive] = useState(true);

    // Ref for the test container 
    const containerRef = useRef(null);

    // -----------------------------------------------------------------
    // HANDLERS (Defined first for ESLint)
    // -----------------------------------------------------------------

    const formatSubmitAnswers = useCallback(() => {
        return Object.entries(answers).map(([questionId, data]) => ({
            questionId,
            selectedOptionIndex: data.selectedOptionIndex,
            numericalAnswer: data.numericalAnswer
        }));
    }, [answers]);

    const handleSubmit = useCallback(async (isTimeUp = false, isViolationSubmit = false) => {
        if (!isTimeUp && !isViolationSubmit && !window.confirm('Are you sure you want to finally submit your test?')) return;
        setSubmitting(true);
        const toastId = toast.loading('Submitting test...');

        try {
            await api.submitTestAttempt(attemptData._id, {
                answers: formatSubmitAnswers(),
                fullscreenExits: fullscreenWarnings,
                autoSubmitReason: isViolationSubmit ? 'fullscreen_violation' : (isTimeUp ? 'time_up' : null)
            });
            toast.success('Test submitted successfully!', { id: toastId });
            onFinish();
        } catch (err) {
            toast.error('Failed to submit test. Try again or contact admin.', { id: toastId });
            setSubmitting(false);
        }
    }, [attemptData._id, formatSubmitAnswers, fullscreenWarnings, onFinish]);

    const handleFullscreenExit = useCallback(async () => {
        if (submitting || isViolation) return;

        const newWarnings = fullscreenWarnings + 1;
        setFullscreenWarnings(newWarnings);
        try { await api.pingTestAttempt(attemptData._id, { fullscreenExits: newWarnings }); } catch (err) { }

        if (newWarnings >= 5) {
            setIsViolation(true);
            toast.error('Test automatically submitted due to multiple fullscreen exits.');
            handleSubmit(false, true);
        } else {
            toast.error(`WARNING: You exited fullscreen. Warning ${newWarnings}/5. At 5, your test will be auto-submitted.`);
        }
    }, [fullscreenWarnings, attemptData._id, submitting, isViolation, handleSubmit]);

    const enterFullscreen = useCallback(() => {
        if (containerRef.current) {
            containerRef.current.requestFullscreen({ navigationUI: "hide" }).catch(() => {
                document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => { });
            });
        }
    }, []);

    // -----------------------------------------------------------------
    // EFFECTS
    // -----------------------------------------------------------------

    // Initial Load
    useEffect(() => {
        api.fetchOnlineTestDetail(testId).then(res => {
            setTest(res.data);
            const startStr = attemptData.startTime;
            const startTime = new Date(startStr).getTime();
            const durationMs = res.data.durationMinutes * 60 * 1000;
            const endTime = startTime + durationMs;
            const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
            setTimeLeft(remaining);
            setLoading(false);

            if (res.data.questions?.length > 0) {
                const qId = res.data.questions[0]._id;
                setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], status: 'visited' } }));
            }
        }).catch(() => {
            toast.error('Failed to load test contents');
            onFinish();
        });
    }, [testId, attemptData.startTime, onFinish]);

    // Timer logic
    useEffect(() => {
        if (loading || timeLeft <= 0 || submitting || isViolation) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, timeLeft, submitting, isViolation, handleSubmit]);

    // Listeners
    useEffect(() => {
        const onFsChange = () => {
            const isActive = !!document.fullscreenElement;
            setIsFullscreenActive(isActive);
            if (!isActive && !submitting && !isViolation) {
                handleFullscreenExit();
            }
        };

        const onVisChange = () => {
            if (document.hidden && !submitting && !isViolation) {
                handleFullscreenExit();
            }
        };

        document.addEventListener('fullscreenchange', onFsChange);
        document.addEventListener('visibilitychange', onVisChange);
        return () => {
            document.removeEventListener('fullscreenchange', onFsChange);
            document.removeEventListener('visibilitychange', onVisChange);
        };
    }, [handleFullscreenExit, submitting, isViolation]);

    // -----------------------------------------------------------------
    // UTILS
    // -----------------------------------------------------------------

    const handleSelectOption = (questionId, optionIndex) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], selectedOptionIndex: optionIndex }
        }));
    };

    const handleInputNumerical = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], numericalAnswer: value }
        }));
    };

    const isQuestionAnswered = (qId) => {
        const ans = answers[qId];
        return ans && (ans.selectedOptionIndex !== undefined || (ans.numericalAnswer !== undefined && ans.numericalAnswer !== ''));
    };

    const updateStatusAndNavigate = (newStatus) => {
        const qId = test.questions[currentIndex]._id;
        let finalStatus = newStatus;
        if (newStatus === 'save') {
            finalStatus = isQuestionAnswered(qId) ? 'answered' : 'visited';
        }
        setAnswers(prev => ({
            ...prev,
            [qId]: { ...prev[qId], status: finalStatus }
        }));
        if (currentIndex < test.questions.length - 1) {
            navigateQuestion(currentIndex + 1);
        }
    };

    const navigateQuestion = (idx) => {
        if (idx < 0 || idx >= test.questions.length) return;
        const currentQId = test.questions[currentIndex]._id;
        if (!answers[currentQId]?.status) {
            setAnswers(prev => ({
                ...prev,
                [currentQId]: { ...prev[currentQId], status: 'visited' }
            }));
        }
        const nextQId = test.questions[idx]._id;
        setAnswers(prev => ({
            ...prev,
            [nextQId]: { ...prev[nextQId], status: prev[nextQId]?.status || 'visited' }
        }));
        setCurrentIndex(idx);
    };

    const handleClearResponse = () => {
        const qId = test.questions[currentIndex]._id;
        setAnswers(prev => {
            const copy = { ...prev };
            if (copy[qId]) {
                delete copy[qId].selectedOptionIndex;
                delete copy[qId].numericalAnswer;
                copy[qId].status = 'visited';
            }
            return copy;
        });
    };

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="fixed inset-0 bg-white z-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#27548A] border-t-transparent animate-spin rounded-full"></div></div>;

    const currentQuestion = test.questions[currentIndex];

    let countAnswered = 0;
    let countReviewed = 0;
    let countVisited = 0;
    let countUnvisited = 0;
    test.questions.forEach(q => {
        const st = answers[q._id]?.status;
        if (st === 'answered') countAnswered++;
        else if (st === 'reviewed') countReviewed++;
        else if (st === 'visited') countVisited++;
        else countUnvisited++;
    });

    const getPaletteColor = (qId) => {
        const st = answers[qId]?.status;
        if (st === 'answered') return 'bg-green-500 text-white border-green-600';
        if (st === 'reviewed') return 'bg-purple-500 text-white border-purple-600';
        if (st === 'visited') return 'bg-red-500 text-white border-red-600';
        return 'bg-white text-gray-700 border-gray-300';
    };

    return (
        <div ref={containerRef} className="fixed inset-0 bg-[#F4F6FF] z-50 flex flex-col overflow-hidden">
            {!isFullscreenActive && !submitting && !isViolation && (
                <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 border-4 border-amber-100 animate-pulse text-amber-600">
                        <FiAlertTriangle size={40} />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Fullscreen Required</h2>
                    <p className="text-gray-600 max-w-sm mb-8 leading-relaxed font-medium">To maintain test integrity, you must remain in fullscreen mode. Please click the button below to continue your exam.</p>
                    <button onClick={enterFullscreen} className="btn-primary px-10 py-4 text-lg font-bold shadow-xl">Enter Fullscreen Mode</button>
                    {fullscreenWarnings > 0 && <p className="mt-8 text-sm font-bold text-red-500 uppercase">Warning {fullscreenWarnings} of 5</p>}
                </div>
            )}

            <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shrink-0 shadow-sm z-10">
                <div>
                    <h1 className="font-display font-bold text-lg text-gray-900">{test.title}</h1>
                    <p className="text-xs text-gray-500 font-medium">Batch {test.batch}</p>
                </div>
                <div className="flex gap-4 items-center">
                    {fullscreenWarnings > 0 && <div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold"><FiAlertTriangle /> {fullscreenWarnings}/5 Warnings</div>}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl text-gray-800 font-mono font-bold text-lg tabular-nums">
                        <FiClock className={timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-gray-400'} />
                        <span className={timeLeft < 300 ? 'text-red-500' : ''}>{formatTime(timeLeft)}</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 flex flex-col overflow-hidden">
                    <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-200 shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-[#27548A]">Question {currentIndex + 1}</span>
                            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-blue-100">{currentQuestion.subject || 'General'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-semibold">
                            <span className="text-green-600">+{currentQuestion.positiveMarks} Marks</span>
                            <span className="text-red-600">-{currentQuestion.negativeMarks} Marks</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="text-base text-gray-800 leading-relaxed font-medium bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <MathRenderer content={currentQuestion.text} />
                            </div>
                            {currentQuestion.imageUrl && <div className="my-4 text-center"><img src={currentQuestion.imageUrl} alt="Graphic" className="max-w-full rounded-xl shadow-sm" style={{ maxHeight: '400px' }} /></div>}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                {currentQuestion.type === 'Numerical' ? (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-3 text-center">Your Answer (Numerical)</label>
                                        <div className="flex justify-center">
                                            <input type="number" step="any" value={answers[currentQuestion._id]?.numericalAnswer || ''} onChange={e => handleInputNumerical(currentQuestion._id, e.target.value)} className="w-full max-w-sm border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-semibold text-center focus:border-[#27548A]" placeholder="Enter value..." />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {currentQuestion.options.map((opt, oIdx) => {
                                            const isSelected = answers[currentQuestion._id]?.selectedOptionIndex === oIdx;
                                            return (
                                                <label key={oIdx} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-colors ${isSelected ? 'border-[#27548A] bg-blue-50' : 'border-gray-100 hover:border-[#27548A]/30'}`}>
                                                    <input type="radio" name="opt" checked={isSelected} onChange={() => handleSelectOption(currentQuestion._id, oIdx)} className="w-5 h-5 accent-[#27548A]" />
                                                    <span className="ml-3 text-sm text-gray-800 font-medium"><MathRenderer content={opt} /></span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border-t border-gray-200 p-4 shrink-0 flex justify-between items-center px-6">
                        <div className="flex gap-3">
                            <button onClick={() => updateStatusAndNavigate('reviewed')} className="px-5 py-2.5 rounded-lg font-bold text-sm bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-2"><FiFlag /> Mark for Review</button>
                            <button onClick={handleClearResponse} className="px-5 py-2.5 rounded-lg font-bold text-sm bg-gray-50 text-gray-600 border border-gray-200">Clear</button>
                        </div>
                        <button onClick={() => updateStatusAndNavigate('save')} className="px-8 py-2.5 rounded-lg font-bold text-sm bg-[#27548A] text-white flex items-center gap-2">Save & Next <FiChevronRight /></button>
                    </div>
                </main>

                <aside className="w-[320px] bg-white border-l border-gray-200 flex flex-col shrink-0 z-10">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg">👤</div>
                        <div className="leading-tight">
                            <div className="text-sm font-bold text-gray-900 line-clamp-1">Batch {attemptData.studentId}</div>
                            <div className="text-xs text-gray-500 font-semibold">{test?.questions?.length || 0} Questions</div>
                        </div>
                    </div>

                    <div className="p-4 border-b border-gray-100 grid grid-cols-2 gap-y-3 gap-x-2 text-[10px] font-bold text-gray-600 uppercase">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-500" /> Answered ({countAnswered})</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500" /> Not Answered ({countVisited})</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-white border border-gray-300" /> Not Visited ({countUnvisited})</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-purple-500" /> Review ({countReviewed})</div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                        <div className="grid grid-cols-5 gap-2">
                            {test?.questions?.map((q, qIdx) => (
                                <button key={q._id} onClick={() => navigateQuestion(qIdx)} className={`h-10 text-sm font-bold rounded-lg border-2 transition-all ${getPaletteColor(q._id)} ${currentIndex === qIdx ? 'ring-2 ring-blue-400' : ''}`}>{qIdx + 1}</button>
                            ))}
                        </div>
                    </div>

                    <div className="p-5 border-t border-gray-200">
                        <button onClick={() => handleSubmit(false)} disabled={submitting} className="w-full btn-primary py-3.5 text-sm font-bold uppercase tracking-widest flex justify-center items-center gap-2 shadow-lg"><FiCheck /> {submitting ? 'Submitting...' : 'Submit Test'}</button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
