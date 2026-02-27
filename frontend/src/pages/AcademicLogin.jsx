import React, { useState } from 'react';
// Force recompile
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLock, FiEye, FiEyeOff, FiBookOpen } from 'react-icons/fi';

export default function AcademicLogin() {
    const [form, setForm] = useState({ userId: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const { academicLogin, academicUser, academicLoading } = useAuth();
    const navigate = useNavigate();

    if (academicLoading) return (
        <div className="min-h-screen bg-[#F4F6FF] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#27548A] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (academicUser) {
        return <Navigate to={academicUser.role === 'admin' ? '/directors-batch/admin-login' : '/student'} replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.userId || !form.password) { setError('Please fill in both fields'); return; }
        setLoading(true);
        const result = await academicLogin(form.userId, form.password);
        setLoading(false);
        if (result.success) {
            if (result.role === 'admin') navigate('/admin');
            else navigate('/student');
        } else {
            setError(result.message || 'Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F6FF] flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex w-16 h-16 bg-[#27548A] rounded-[16px] items-center justify-center mb-4 shadow-soft-lg">
                        <FiBookOpen className="text-white" size={28} />
                    </div>
                    <h1 className="font-body text-3xl font-bold text-gray-800 mb-1">Academic Portal</h1>
                    <p className="text-gray-400 font-body text-sm">Login with your numeric ID and password</p>
                </div>

                <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-soft-lg p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-sm font-sans px-4 py-3 rounded-[12px]">{error}</div>}
                        <div>
                            <label className="text-gray-400 font-body text-xs font-semibold uppercase tracking-wider mb-2 block">User ID</label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input type="text" value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })}
                                    placeholder="Enter your numeric ID" className="input-field pl-10" autoComplete="username" />
                            </div>
                        </div>
                        <div>
                            <label className="text-gray-400 font-body text-xs font-semibold uppercase tracking-wider mb-2 block">Password</label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                                    placeholder="Enter your password" className="input-field pl-10 pr-10" autoComplete="current-password" />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                                    {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Login'}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-6 space-y-2">
                    <p className="text-gray-400 font-body text-xs">
                        <button onClick={() => navigate('/')} className="text-[#27548A] hover:text-[#4478D6] transition-colors duration-200">Back to Website</button>
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-300 font-sans">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#27548A]" /> Admin</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#7ED6A7]" /> Student</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
