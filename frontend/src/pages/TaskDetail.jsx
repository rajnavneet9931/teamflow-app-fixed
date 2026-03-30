import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

const AVATAR_COLORS = ['bg-indigo-500','bg-purple-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-teal-500','bg-blue-500','bg-pink-500'];
const avatarColor = (id) => AVATAR_COLORS[(id ?? 0) % AVATAR_COLORS.length];

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [usersMap, setUsersMap] = useState({});

  useEffect(() => {
    fetchTask(); fetchComments();
    API.get('/users/me').then(res => setCurrentUserId(res.data.id)).catch(() => {});
    API.get('/users').then(res => { const m = {}; res.data.forEach(u => { m[u.id] = u; }); setUsersMap(m); }).catch(() => {});
  }, []);

  const fetchTask     = async () => { try { setTask((await API.get(`/tasks/${id}`)).data); } catch(e){ console.error(e); } };
  const fetchComments = async () => { try { setComments((await API.get(`/comments?filter={"where":{"taskId":${id}}}`)).data); } catch(e){ console.error(e); } };

  const handleAddComment = async (e) => {
    e.preventDefault();
    try { await API.post('/comments', { content: comment, taskId: Number(id), createdAt: new Date().toISOString() }); setComment(''); fetchComments(); }
    catch (err) { alert('Failed to add comment!'); }
  };

  const handleDeleteComment = async (cid) => {
    if (!window.confirm('Delete this comment?')) return;
    try { await API.delete(`/comments/${cid}`); fetchComments(); } catch { alert('Could not delete comment.'); }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try { await API.delete(`/tasks/${id}`); navigate('/dashboard'); } catch(e){ console.error(e); }
  };

  const handleStatusChange = async (e) => {
    try { await API.patch(`/tasks/${id}`, { status: e.target.value }); fetchTask(); } catch(e){ console.error(e); }
  };

  const statusPill = (s) => {
    if (s === 'completed') return 'pill-completed';
    if (s === 'in_progress') return 'pill-progress';
    return 'pill-pending';
  };

  if (!task) return (
    <div className="mesh-bg flex items-center justify-center">
      <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        Loading…
      </div>
    </div>
  );

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
        {/* Task Card */}
        <div className="glass p-6 animate-in">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{task.title}</h2>
              {task.description && <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{task.description}</p>}
            </div>
            {currentUserId === task.createdBy && (
              <button onClick={handleDeleteTask} className="text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)' }}>
                Delete
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Due date */}
            {task.dueDate && (
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium">{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Status:</span>
              <select value={task.status} onChange={handleStatusChange}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer border-0 outline-none ${statusPill(task.status)}`}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="glass p-6 animate-in" style={{ animationDelay: '80ms' }}>
          <h3 className="text-base font-bold mb-5" style={{ color: 'var(--text-primary)' }}>
            Comments <span className="font-normal text-sm" style={{ color: 'var(--text-muted)' }}>({comments.length})</span>
          </h3>

          {comments.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No comments yet — be the first!</p>
          ) : (
            <div className="space-y-4 mb-5">
              {comments.map(c => {
                const author = usersMap[c.userId];
                const initials = author?.name?.charAt(0).toUpperCase() ?? '?';
                const isOwn = c.userId === currentUserId;
                return (
                  <div key={c.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${avatarColor(c.userId)}`}>
                      {initials}
                    </div>
                    <div className={`flex-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                          {isOwn ? 'You' : (author?.name ?? `User ${c.userId}`)}
                        </span>
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className={`relative group px-4 py-2.5 rounded-2xl text-sm max-w-xs lg:max-w-md ${
                        isOwn
                          ? 'rounded-tr-sm text-white'
                          : 'rounded-tl-sm'
                      }`}
                        style={isOwn
                          ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }
                          : { background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)' }}
                      >
                        {c.content}
                        {isOwn && (
                          <button onClick={() => handleDeleteComment(c.id)}
                            className="absolute -top-2 -right-2 hidden group-hover:flex w-5 h-5 bg-red-500 text-white text-xs rounded-full items-center justify-center hover:bg-red-600"
                            title="Delete comment">✕</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleAddComment} className="flex gap-2 mt-4">
            <input type="text" placeholder="Write a comment…" value={comment} onChange={(e) => setComment(e.target.value)} required className="input-dark flex-1 text-sm" />
            <button type="submit" className="btn-accent text-sm px-5">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}