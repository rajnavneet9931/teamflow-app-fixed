import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function CreateTask() {
  const [form, setForm] = useState({ title: '', description: '', status: 'pending', dueDate: '' });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [assignToAll, setAssignToAll] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/users', { withCredentials: true })
      .then(res => setUsers(res.data))
      .catch(err => console.error('Failed to fetch users', err));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleUser = (userId) => {
    setAssignToAll(false);
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.dueDate) { alert('⚠️ Please set a due date before creating the task.'); return; }
    if (form.dueDate < todayStr) { alert('⚠️ Due date cannot be in the past.'); return; }

    setLoading(true);
    try {
      const assignedTo = assignToAll ? 'all' : selectedUsers.length > 0 ? JSON.stringify(selectedUsers) : undefined;
      const payload = {
        title: form.title, status: form.status, createdAt: new Date().toISOString(),
        ...(form.description ? { description: form.description } : {}),
        dueDate: new Date(form.dueDate).toISOString(),
        ...(assignedTo !== undefined ? { assignedTo } : {}),
      };
      await API.post('/tasks', payload);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error?.message || data?.message || 'Failed to create task.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mesh-bg flex items-center justify-center px-4">
      <div className="animate-in w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl transition-all duration-200" style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Create Task</h2>
        </div>

        {/* Card */}
        <div className="glass p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium mb-2 tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Title <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input name="title" type="text" placeholder="Task title" onChange={handleChange} required className="input-dark" />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium mb-2 tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Description</label>
              <textarea name="description" placeholder="Optional description…" rows={3} onChange={handleChange} className="input-dark" style={{ resize: 'vertical' }} />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium mb-2 tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Status</label>
              <select name="status" onChange={handleChange} className="input-dark" style={{ cursor: 'pointer' }}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-medium mb-2 tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Due Date <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input name="dueDate" type="date" onChange={handleChange} required min={todayStr} className="input-dark" style={{ colorScheme: 'dark' }} />
            </div>

            {/* Assign To */}
            <div>
              <label className="block text-xs font-medium mb-2 tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Assign To</label>

              {/* Everyone toggle */}
              <button
                type="button"
                onClick={() => { setAssignToAll(a => !a); setSelectedUsers([]); setSearch(''); }}
                className="mb-3 text-xs px-3 py-1.5 rounded-full font-semibold transition-all duration-200"
                style={assignToAll
                  ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }
                  : { background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                {assignToAll ? '✓ Everyone assigned' : '+ Assign to Everyone'}
              </button>

              {/* Chips */}
              {!assignToAll && selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedUsers.map(uid => {
                    const u = users.find(x => x.id === uid);
                    return (
                      <span key={uid} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa' }}>
                        {u?.name}
                        <button type="button" onClick={() => toggleUser(uid)} className="ml-0.5 hover:text-white">✕</button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Search */}
              {!assignToAll && (
                <div className="relative">
                  <input
                    type="text" value={search}
                    onChange={e => { setSearch(e.target.value); setDropdownOpen(true); }}
                    onFocus={() => setDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                    placeholder="Search users…"
                    className="input-dark text-sm"
                  />
                  {dropdownOpen && (
                    <ul className="absolute z-10 mt-1 w-full rounded-xl overflow-hidden shadow-2xl" style={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {users
                        .filter(u => u.name.toLowerCase().includes(search.toLowerCase()) && !selectedUsers.includes(u.id))
                        .slice(0, 6)
                        .map(u => (
                          <li key={u.id} onMouseDown={() => { toggleUser(u.id); setSearch(''); }}
                            className="px-4 py-2.5 text-sm cursor-pointer transition-all duration-150"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={e => { e.target.style.background='rgba(99,102,241,0.1)'; e.target.style.color='#a78bfa'; }}
                            onMouseLeave={e => { e.target.style.background='transparent'; e.target.style.color='var(--text-secondary)'; }}
                          >
                            {u.name}
                          </li>
                        ))
                      }
                      {users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) && !selectedUsers.includes(u.id)).length === 0 && (
                        <li className="px-4 py-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>No users found</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-accent flex-1 text-sm" style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Creating…' : 'Create Task'}
              </button>
              <button type="button" onClick={() => navigate('/dashboard')}
                className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}