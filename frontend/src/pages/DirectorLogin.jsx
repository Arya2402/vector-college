import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiLogIn, FiShield } from 'react-icons/fi';

export default function DirectorLogin() {
    const [form, setForm] = useState({ userId: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { academicLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await academicLogin(form.userId, form.password);
            if (result.role === 'director') {
                toast.success('Welcome, Director');
                navigate('/directors-batch');
            } else {
                toast.error('Director access required');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F6FF] flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-[#27548A] rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <FiShield className="text-white" size={24} />
                    </div>
                    <h1 className="font-display font-bold text-2xl text-gray-900">Director's Portal</h1>
                    <p className="text-gray-400 text-sm font-sans mt-1">Student Analysis & Management</p>
                </div>
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                    <div>
                        <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Admin ID</label>
                        <input type="number" value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })}
                            className="input-field" placeholder="Enter admin ID" required />
                    </div>
                    <div>
                        <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Password</label>
                        <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                            className="input-field" placeholder="Enter password" required />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
                        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiLogIn size={16} />}
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
