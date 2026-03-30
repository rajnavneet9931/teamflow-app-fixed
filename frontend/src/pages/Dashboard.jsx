import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import NotificationBell from '../components/NotificationBell';

function isAssignee(assignedTo, userId) {
  if (!assignedTo) return false;
  if (assignedTo === 'all') return true;
  try { return JSON.parse(assignedTo).includes(userId); } catch { return false; }
}

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('assigned');
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/users/me')
      .then(res => { setUser(res.data); fetchTasks(); })
      .catch(() => navigate('/login'));
  }, []);

  const fetchTasks = async () => {
    try { const res = await API.get('/tasks'); setTasks(res.data); }
    catch (err) { console.error(err); }
  };

  const handleLogout = async () => {
    await API.post('/users/logout', {}, { withCredentials: true });
    navigate('/login');
  };

  const myId = user?.id;
  const createdByMe  = tasks.filter(t => t.createdBy === myId);
  const assignedToMe = tasks.filter(t => t.createdBy !== myId && isAssignee(t.assignedTo, myId));

  const statusPill = (s) => {
    if (s === 'completed')   return 'pill-completed';
    if (s === 'in_progress') return 'pill-progress';
    return 'pill-pending';
  };

  const TaskCard = ({ task, badge }) => (
    <div
      onClick={() => navigate(`/tasks/${task.id}`)}
      className="glass glass-hover cursor-pointer transition-all duration-200 p-5 animate-in"
      style={{ animationDelay: `${(task.id % 10) * 40}ms` }}
    >
      <div className="flex justify-between items-start gap-3">
        <h3 className="text-base font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{task.title}</h3>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${statusPill(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
          {badge && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
              {badge}
            </span>
          )}
        </div>
      </div>
      {task.description && (
        <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
      )}
      {task.dueDate && (
        <div className="flex items-center gap-1.5 mt-3" style={{ color: 'var(--text-muted)' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-medium">{new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );

  const EmptyState = ({ text }) => (
    <div className="text-center mt-16 animate-in">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: 'rgba(99,102,241,0.1)' }}>
        <svg className="w-7 h-7" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{text}</p>
    </div>
  );

  const Tab = ({ id, label, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
        activeTab === id
          ? 'text-white shadow-lg'
          : 'text-slate-400 hover:text-slate-200'
      }`}
      style={activeTab === id ? {
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
      } : {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {label}
      <span className={`text-[11px] min-w-[20px] h-5 flex items-center justify-center rounded-full font-bold ${
        activeTab === id ? 'bg-white/20' : 'bg-white/5'
      }`}>
        {count}
      </span>
    </button>
  );

  return (
    <div className="mesh-bg" style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="glass sticky top-0 z-40 px-6 py-3 flex justify-between items-center" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Teamflow
        </h1>
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium mr-1" style={{ color: 'var(--text-secondary)' }}>
            {user?.name}
          </span>
          {/* Reminders shortcut */}
          <button
            onClick={() => navigate('/reminders')}
            title="My Reminders"
            className="p-2 rounded-xl transition-all duration-200 hover:scale-105"
            style={{ color: 'var(--warning)', background: 'rgba(245,158,11,0.1)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <NotificationBell />
          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-200"
            style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)' }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Tasks</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage and track your work</p>
          </div>
          <button onClick={() => navigate('/tasks/create')} className="btn-accent text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8">
          <Tab id="assigned" label="Assigned to Me" count={assignedToMe.length} />
          <Tab id="created"  label="Created by Me"  count={createdByMe.length} />
        </div>

        {/* Tasks */}
        {activeTab === 'assigned' && (
          assignedToMe.length === 0
            ? <EmptyState text="No tasks assigned to you yet." />
            : <div className="grid grid-cols-1 gap-4">
                {assignedToMe.map(t => <TaskCard key={t.id} task={t} badge={`from user ${t.createdBy}`} />)}
              </div>
        )}
        {activeTab === 'created' && (
          createdByMe.length === 0
            ? <EmptyState text="You haven't created any tasks yet." />
            : <div className="grid grid-cols-1 gap-4">
                {createdByMe.map(t => <TaskCard key={t.id} task={t} />)}
              </div>
        )}
      </div>
    </div>
  );
}