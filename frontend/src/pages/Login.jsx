import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/users/login', {
        email: form.email,
        password: form.password,
      }, { withCredentials: true });
      navigate('/dashboard');
    } catch (err) {
      alert('Invalid email or password!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mesh-bg flex items-center justify-center px-4">
      <div className="animate-in w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Teamflow
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="glass p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium mb-2 tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                onChange={handleChange}
                required
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Password</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                onChange={handleChange}
                required
                className="input-dark"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-accent w-full text-sm"
              style={{ padding: '12px 24px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <a
                href="/register"
                className="font-semibold hover:underline"
                style={{ color: 'var(--accent-hover)' }}
              >
                Create one
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}