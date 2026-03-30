import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try { setNotifications((await API.get('/notifications/my', { withCredentials: true })).data); }
    catch { /* silent */ }
  };

  useEffect(() => { fetchNotifications(); const i = setInterval(fetchNotifications, 30_000); return () => clearInterval(i); }, []);

  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try { await API.patch('/notifications/mark-all-read', {}, { withCredentials: true }); setNotifications(p => p.map(n => ({ ...n, isRead: true }))); } catch {}
  };

  const handleClickNotif = async (notif) => {
    try { if (!notif.isRead) { await API.patch(`/notifications/${notif.id}/read`, {}, { withCredentials: true }); setNotifications(p => p.map(n => n.id === notif.id ? { ...n, isRead: true } : n)); } } catch {}
    if (notif.taskId) { setOpen(false); navigate(`/tasks/${notif.taskId}`); }
  };

  const timeAgo = (d) => {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  const ICONS = { task_assigned: '📋', deadline: '⚠️', comment: '💬', task_deleted: '🗑️' };

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setOpen(o => !o)} title="Notifications" aria-label="Notifications"
        className="relative p-2 rounded-xl transition-all duration-200 hover:scale-105"
        style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full leading-none text-white"
            style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', boxShadow: '0 2px 8px rgba(239,68,68,0.4)', animation: 'pulse-dot 2s ease-in-out infinite' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden z-50 animate-in" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-semibold hover:underline" style={{ color: 'var(--accent-hover)' }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto" style={{ borderBottom: notifications.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <button key={n.id} onClick={() => handleClickNotif(n)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 transition-all duration-150"
                  style={{ background: !n.isRead ? 'rgba(99,102,241,0.06)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = !n.isRead ? 'rgba(99,102,241,0.06)' : 'transparent'}
                >
                  <span className="text-base mt-0.5 flex-shrink-0">{ICONS[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold' : ''}`}
                      style={{ color: !n.isRead ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {n.message}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.createdAt ? timeAgo(n.createdAt) : ''}</p>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: 'var(--accent)' }} />}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 text-center">
              <button onClick={() => { setOpen(false); navigate('/reminders'); }}
                className="text-xs font-medium transition-all hover:underline" style={{ color: 'var(--text-muted)' }}>
                Manage reminders →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
