import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ taskId: '', remindAt: '' });
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/users/me', { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => navigate('/login'));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchReminders();
    fetchTasks();
  }, [user]);

  const fetchReminders = async () => {
    try { setReminders((await API.get(`/reminders?filter={"where":{"userId":${user.id}}}`)).data); }
    catch (err) { console.error(err); }
  };

  const fetchTasks = async () => {
    try { setTasks((await API.get('/tasks')).data); }
    catch (err) { console.error(err); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/reminders', {
        taskId: Number(form.taskId), userId: user.id,
        remindAt: new Date(form.remindAt).toISOString(),
        isSent: false, createdAt: new Date().toISOString(),
      });
      setForm({ taskId: '', remindAt: '' });
      fetchReminders();
    } catch (err) { alert('Failed to create reminder!'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    try { await API.delete(`/reminders/${id}`); fetchReminders(); } catch (err) { console.error(err); }
  };

  const getTaskTitle = (taskId) => { const t = tasks.find(x => x.id === taskId); return t ? t.title : 'Unknown Task'; };

  return (
    <div className="mesh-bg" style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="glass sticky top-0 z-40 px-6 py-3 flex justify-between items-center" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Teamflow</h1>
        <button onClick={() => navigate('/dashboard')} className="text-sm font-medium px-3 py-1.5 rounded-xl transition-all"
          style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)' }}>
          ← Dashboard
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Create Reminder */}
        <div className="glass p-6 animate-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--warning)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Set a Reminder</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2 tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Select Task</label>
              <select name="taskId" value={form.taskId} onChange={handleChange} required className="input-dark" style={{ cursor: 'pointer' }}>
                <option value="">Choose a task…</option>
                {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Remind At</label>
              <input name="remindAt" type="datetime-local" value={form.remindAt} onChange={handleChange} required className="input-dark" style={{ colorScheme: 'dark' }} />
            </div>
            <button type="submit" className="btn-accent w-full text-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              Set Reminder
            </button>
          </form>
        </div>

        {/* Reminders List */}
        <div className="glass p-6 animate-in" style={{ animationDelay: '80ms' }}>
          <h2 className="text-base font-bold mb-5" style={{ color: 'var(--text-primary)' }}>My Reminders</h2>
          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">🔔</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No reminders yet!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map(r => (
                <div key={r.id} className="flex justify-between items-center p-4 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{getTaskTitle(r.taskId)}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(r.remindAt).toLocaleString()}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full mt-1.5 inline-block font-semibold ${r.isSent ? 'pill-completed' : 'pill-progress'}`}>
                      {r.isSent ? 'Sent' : 'Pending'}
                    </span>
                  </div>
                  <button onClick={() => handleDelete(r.id)} className="text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                    style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)' }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
