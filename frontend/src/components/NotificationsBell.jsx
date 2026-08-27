import { useEffect, useRef, useState } from 'react';
import client from '../api/client.js';
import { BellIcon } from './icons.jsx';

export default function NotificationsBell({ user }) {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  const loadCount = () => {
    if (!user) return;
    client.get('/notifications/unread-count').then((res) => setCount(res.data.unread || 0)).catch(() => {});
  };

  useEffect(() => {
    loadCount();
    const t = setInterval(loadCount, 30000);
    return () => clearInterval(t);
  }, [user?.id]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && user) {
      client.get('/notifications', { params: { per_page: 20 } }).then((res) => setItems(res.data.data || [])).catch(() => {});
    }
  };

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const markAll = async () => {
    await client.post('/notifications/read-all').catch(() => {});
    setCount(0);
    setItems((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition relative"
        title="Notifications"
      >
        <BellIcon className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-lift border border-ink-100 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
            <p className="font-bold text-ink-800 text-sm">Notifications</p>
            {count > 0 && (
              <button onClick={markAll} className="text-[11px] font-bold text-bayan-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-center text-ink-400 text-sm py-8">No notifications.</p>
          ) : (
            items.map((n) => (
              <div key={n.id} className={`px-4 py-3 border-b border-ink-50 ${n.read_at ? 'opacity-60' : ''}`}>
                <p className="text-sm font-bold text-ink-800">{n.icon} {n.title}</p>
                {n.body && <p className="text-xs text-ink-500 mt-0.5">{n.body}</p>}
                <p className="text-[10px] text-ink-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}