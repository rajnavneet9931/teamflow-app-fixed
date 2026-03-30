import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const PW_RULES = [
  { test: (pw) => pw.length >= 8, label: '8+ characters' },
  { test: (pw) => /[A-Z]/.test(pw), label: 'Uppercase letter' },
  { test: (pw) => /[a-z]/.test(pw), label: 'Lowercase letter' },
  { test: (pw) => /[0-9]/.test(pw), label: 'Number' },
  { test: (pw) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw), label: 'Special character' },
];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const allPassed = PW_RULES.every(r => r.test(form.password));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allPassed) { alert('Please meet all password requirements.'); return; }

    setLoading(true);
    try {
      await API.post('/users', { ...form, createdAt: new Date().toISOString() });
      alert('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error?.message || data?.message || 'Registration failed!';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = form.password.length === 0 ? 0 : PW_RULES.filter(r => r.test(form.password)).length;
  const strengthPercent = (pwStrength / PW_RULES.length) * 100;
  const strengthColor = strengthPercent <= 40 ? '#ef4444' : strengthPercent <= 80 ? '#f59e0b' : '#22c55e';

  return (
    <div className="mesh-bg flex items-center justify-center px-4">
      <div className="animate-in w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Join Teamflow
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Create your free account</p>
        </div>

        {/* Card */}
        <div className="glass p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium mb-2 tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Full Name</label>
              <input name="name" type="text" placeholder="John Doe" value={form.name} onChange={handleChange} required className="input-dark" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required className="input-dark" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Password</label>
              <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required className="input-dark" />

              {/* Strength bar */}
              {form.password.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${strengthPercent}%`, background: strengthColor }} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {PW_RULES.map((r, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: r.test(form.password) ? '#4ade80' : 'var(--text-muted)' }}>
                        <span className="text-[10px]">{r.test(form.password) ? '✓' : '○'}</span>
                        {r.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !allPassed}
              className="btn-accent w-full text-sm"
              style={{ padding: '12px 24px', opacity: (loading || !allPassed) ? 0.5 : 1, cursor: (loading || !allPassed) ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <a href="/login" className="font-semibold hover:underline" style={{ color: 'var(--accent-hover)' }}>Sign in</a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
