import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../api';
import toast from 'react-hot-toast';
import { FiClock, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

export default function TestRunner({ testId, attemptData, onFinish }) {
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState([]); // [{ questionId, selectedOptionIndex }]
    const [timeLeft, setTimeLeft] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [fullscreenWarnings, setFullscreenWarnings] = useState(attemptData?.fullscreenExits || 0);
    const [isViolation, setIsViolation] = useState(false);

    // Load test details for student
    useEffect(() => {
        api.fetchOnlineTestDetail(testId).then(res => {
            setTest(res.data);

            // Calculate time left
            const startStr = attemptData.startTime;
            const startTime = new Date(startStr).getTime();
            const durationMs = res.data.durationMinutes * 60 * 1000;
            const endTime = startTime + durationMs;
            const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
            setTimeLeft(remaining);
            setLoading(false);
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
                    handleSubmit(true); // auto submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, timeLeft, submitting, isViolation]);

    // Fullscreen enforcement and cheat prevention
    const handleFullscreenExit = useCallback(async () => {
        if (submitting || isViolation) return;

        const newWarnings = fullscreenWarnings + 1;
        setFullscreenWarnings(newWarnings);

        try {
            await api.pingTestAttempt(attemptData._id, { fullscreenExits: newWarnings });
        } catch (err) {
            console.error('Failed to ping warnings');
        }

        if (newWarnings >= 5) {
            setIsViolation(true);
            toast.error('Test automatically submitted due to multiple fullscreen exits.');
            handleSubmit(false, true); // violation auto submit
        } else {
            toast.error(`WARNING: You exited fullscreen. Warning ${newWarnings}/5. At 5, your test will be auto-submitted.`);
            // Prompt back to fullscreen
            setTimeout(() => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => { });
                }
            }, 3000);
        }
    }, [fullscreenWarnings, attemptData._id, submitting, isViolation]);

    useEffect(() => {
        const checkFullscreen = () => {
            if (!document.fullscreenElement && !submitting && !isViolation) {
                handleFullscreenExit();
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden && !submitting && !isViolation) {
                handleFullscreenExit();
            }
        };

        document.addEventListener('fullscreenchange', checkFullscreen);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Initial force fullscreen
        document.documentElement.requestFullscreen().catch(() => {
            toast.error('Please put your browser in fullscreen to take the test.');
        });

        return () => {
            document.removeEventListener('fullscreenchange', checkFullscreen);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }
        };
    }, [handleFullscreenExit, submitting, isViolation]);

    const handleSelectOption = (questionId, optionIndex) => {
        setAnswers(prev => {
            const existingIdx = prev.findIndex(a => a.questionId === questionId);
            if (existingIdx !== -1) {
                const newAnswers = [...prev];
                newAnswers[existingIdx].selectedOptionIndex = optionIndex;
                return newAnswers;
            } else {
                return [...prev, { questionId, selectedOptionIndex: optionIndex }];
            }
        });
    };

    const handleClearOption = (questionId) => {
        setAnswers(prev => prev.filter(a => a.questionId !== questionId));
    };

    const getSelectedOption = (questionId) => {
        const a = answers.find(x => x.questionId === questionId);
        return a ? a.selectedOptionIndex : null;
    };

    const handleSubmit = async (isTimeUp = false, isViolationSubmit = false) => {
        if (!isTimeUp && !isViolationSubmit && !window.confirm('Are you sure you want to finally submit your test?')) return;
        setSubmitting(true);
        const toastId = toast.loading('Submitting test...');

        try {
            await api.submitTestAttempt(attemptData._id, {
                answers,
                fullscreenExits: fullscreenWarnings,
                autoSubmitReason: isViolationSubmit ? 'fullscreen_violation' : (isTimeUp ? 'time_up' : null)
            });
            toast.success('Test submitted successfully!', { id: toastId });
            onFinish();
        } catch (err) {
            toast.error('Failed to submit test. Try again or contact admin.', { id: toastId });
            setSubmitting(false);
        }
    };

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="fixed inset-0 bg-white z-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#27548A] border-t-transparent animate-spin rounded-full"></div></div>;

    const attemptedCount = answers.length;
    const totalCount = test?.questions?.length || 0;

    return (
        <div className="fixed inset-0 bg-[#F4F6FF] z-50 flex flex-col overflow-hidden">
            <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="font-display font-bold text-lg text-gray-900">{test.title}</h1>
                    <p className="text-xs text-gray-500 font-medium">Batch {test.batch} | +{test.positiveMarks} / -{test.negativeMarks}</p>
                </div>

                <div className="flex gap-4 items-center">
                    {fullscreenWarnings > 0 && (
                        <div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                            <FiAlertTriangle /> {fullscreenWarnings}/5 Warnings
                        </div>
                    )}

                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl text-gray-800 font-mono font-bold text-lg tabular-nums">
                        <FiClock className={timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-gray-400'} />
                        <span className={timeLeft < 300 ? 'text-red-500' : ''}>{formatTime(timeLeft)}</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <div className="max-w-4xl mx-auto space-y-8 pb-32">
                        {test.questions.map((q, qIdx) => (
                            <div key={q._id} id={`q-${qIdx}`} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:p-8">
                                <div className="flex justify-between items-start mb-4 gap-4">
                                    <span className="shrink-0 bg-[#27548A] text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-lg">{qIdx + 1}</span>
                                    <div className="flex-1 text-base text-gray-800 leading-relaxed font-medium pt-1">
                                        {q.text.split('$').map((segment, index) =>
                                            index % 2 === 1 ? <InlineMath key={index}>{segment}</InlineMath> : segment
                                        )}
                                    </div>
                                </div>

                                {q.imageUrl && <div className="my-4 ml-12"><img src={q.imageUrl} alt="Question Graphic" className="max-w-full rounded border border-gray-100 shadow-sm" style={{ maxHeight: '300px' }} /></div>}

                                <div className="ml-12 grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                                    {q.options.map((opt, oIdx) => {
                                        const isSelected = getSelectedOption(q._id) === oIdx;
                                        return (
                                            <label key={oIdx} className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-colors ${isSelected ? 'border-[#27548A] bg-blue-50/50' : 'border-gray-100 hover:border-[#27548A]/30 hover:bg-gray-50'}`}>
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="radio"
                                                        name={`q-${q._id}`}
                                                        checked={isSelected}
                                                        onChange={() => handleSelectOption(q._id, oIdx)}
                                                        className="peer w-5 h-5 opacity-0 absolute cursor-pointer"
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-[#27548A] bg-[#27548A]' : 'border-gray-300'}`}>
                                                        {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                                    </div>
                                                </div>
                                                <span className="ml-3 text-sm text-gray-700 font-medium">
                                                    {opt.split('$').map((seg, idx) => idx % 2 === 1 ? <InlineMath key={idx}>{seg}</InlineMath> : seg)}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>

                                {getSelectedOption(q._id) !== null && (
                                    <div className="ml-12 mt-4 inline-flex">
                                        <button onClick={() => handleClearOption(q._id)} className="text-[11px] font-semibold text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors">Clear Selection</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </main>

                <aside className="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="text-sm font-semibold text-gray-700">Attempted</div>
                        <div className="flex items-end gap-1 mt-1">
                            <span className="text-2xl font-bold text-[#27548A]">{attemptedCount}</span>
                            <span className="text-gray-400 font-medium text-sm mb-0.5">/ {totalCount}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                            <div className="bg-[#27548A] h-1.5 rounded-full transition-all" style={{ width: `${(attemptedCount / totalCount) * 100}%` }}></div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-5 gap-2">
                            {test.questions.map((q, qIdx) => {
                                const isAns = getSelectedOption(q._id) !== null;
                                return (
                                    <a key={q._id} href={`#q-${qIdx}`} className={`flex items-center justify-center h-8 text-xs font-bold rounded-lg border-2 transition-colors ${isAns ? 'bg-[#27548A] border-[#27548A] text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                        {qIdx + 1}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-200">
                        <button onClick={() => handleSubmit(false)} disabled={submitting} className="w-full btn-primary py-3 text-sm flex justify-center items-center gap-2 shadow-md">
                            <FiCheck size={16} /> {submitting ? 'Submitting...' : 'Submit Test'}
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
