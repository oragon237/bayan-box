import { useState, useCallback, createContext, useContext } from 'react';

// ─── Badge ───────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  received_at_hub: 'bg-amber-100 text-amber-800 border-amber-200',
  out_for_delivery: 'bg-blue-100 text-blue-800 border-blue-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  returned: 'bg-red-100 text-red-800 border-red-200',
  picked_up: 'bg-purple-100 text-purple-800 border-purple-200',
  pending: 'bg-ink-100 text-ink-600 border-ink-200',
  accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  in_transit: 'bg-blue-100 text-blue-800 border-blue-200',
};

export function Badge({ status, className = '' }) {
  const style = STATUS_STYLES[status] || 'bg-ink-100 text-ink-600 border-ink-200';
  return (
    <span className={`chip border ${style} ${className}`}>
      {status.replaceAll('_', ' ')}
    </span>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className="card p-4 text-center">
      <span className="block text-xs font-semibold uppercase tracking-wider text-ink-400">{label}</span>
      <span className={`block mt-1 text-3xl font-black tracking-tight ${accent ? 'text-bayan-600' : 'text-ink-900'}`}>
        {value}
      </span>
      {sub && <span className="block mt-1 text-xs text-ink-400">{sub}</span>}
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <svg className={`animate-spin text-bayan-600 ${s[size]} ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📦', title, hint, action }) {
  return (
    <div className="card p-8 text-center animate-fade-up">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-ink-700">{title || 'Nothing here yet'}</h3>
      {hint && <p className="mt-1 text-sm text-ink-400">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Toast system ────────────────────────────────────────────────────────────
const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const notify = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <ToastHost toast={toast} />
    </ToastContext.Provider>
  );
}

function ToastHost({ toast }) {
  if (!toast) return null;
  const bg = toast.type === 'success' ? 'bg-bayan-600' : 'bg-red-600';
  const icon = toast.type === 'success' ? '✓' : '✕';

  return (
    <div className="fixed top-20 left-4 right-4 z-50 animate-fade-up">
      <div className={`${bg} text-white rounded-2xl px-5 py-3.5 shadow-lift max-w-sm mx-auto flex items-center gap-3`}>
        <span className="text-lg font-black">{icon}</span>
        <span className="text-sm font-semibold">{toast.msg}</span>
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }) {
  return <div className={`bg-ink-200 rounded-2xl animate-pulse-soft ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-4 space-y-3 animate-fade-up">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}