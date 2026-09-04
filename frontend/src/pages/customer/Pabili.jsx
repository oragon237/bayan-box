import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client.js';
import { EmptyState, Spinner, useToast } from '../../components/ui.jsx';

const STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  quoted: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  converted: 'bg-green-50 text-green-700 border-green-200',
  declined: 'bg-ink-100 text-ink-500 border-ink-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

const STATUS_LABEL = {
  pending: '⏳ Waiting for price',
  quoted: '🧾 Price confirmed — approve?',
  approved: '🛒 On the way',
  converted: '🛒 On the way',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

const emptyItem = () => ({ product_name: '', details: '', quantity: 1, max_price: '' });

export default function Pabili({ user }) {
  const navigate = useNavigate();
  const notify = useToast();
  const [items, setItems] = useState([emptyItem()]);
  const [notes, setNotes] = useState('');
  const [profileAddr, setProfileAddr] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadRequests = () => {
    client.get('/pabili')
      .then((res) => setRequests(res.data.data || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    client.get('/profile').then((res) => {
      const p = res.data.user || {};
      setProfileAddr([p.barangay, p.municipality].filter(Boolean).join(', ') || null);
    }).catch(() => {});
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const setItem = (idx, key) => (e) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: e.target.value } : it)));
  const addItem = () => setItems((prev) => (prev.length >= 15 ? prev : [...prev, emptyItem()]));
  const removeItem = (idx) => setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const submit = async (e) => {
    e.preventDefault();
    const cleaned = items
      .filter((it) => it.product_name.trim())
      .map((it) => ({
        product_name: it.product_name.trim(),
        details: it.details.trim() || null,
        quantity: Math.max(1, Number(it.quantity) || 1),
        max_price: it.max_price === '' ? null : Number(it.max_price),
      }));
    if (cleaned.length === 0) { notify('List at least one item to pabili.', 'error'); return; }
    setBusy(true);
    try {
      const res = await client.post('/pabili', { items: cleaned, notes: notes.trim() || null });
      notify(res.data.message);
      setItems([emptyItem()]);
      setNotes('');
      loadRequests();
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : err.response?.data?.message || 'Could not send request.';
      notify(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id) => {
    try { const res = await client.post(`/pabili/${id}/cancel`, {}); notify(res.data.message); loadRequests(); }
    catch (err) { notify(err.response?.data?.message || 'Could not cancel.', 'error'); }
  };

  const approve = async (id) => {
    try {
      const res = await client.post(`/pabili/${id}/approve`, {});
      notify(res.data.message);
      loadRequests();
      if (res.data.order_id) navigate(`/orders/${res.data.order_id}/track`);
    } catch (err) { notify(err.response?.data?.message || 'Could not approve.', 'error'); }
  };

  const decline = async (id) => {
    try { const res = await client.post(`/pabili/${id}/decline`, {}); notify(res.data.message); loadRequests(); }
    catch (err) { notify(err.response?.data?.message || 'Could not decline.', 'error'); }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/80">Wala ba sa store? Pabili mo na lang!</p>
        <h2 className="text-2xl font-black tracking-tight mt-1">🧾 Pabili — Buy For Me</h2>
        <p className="text-white/85 text-sm mt-1">
          Item not in the catalog? List it (add as many items as you want), our staff will confirm the
          price, you approve — and it ships to your door like a normal order with live rider tracking.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3 text-[10px] font-bold">
          {['1️⃣ You list items', '2️⃣ Staff confirms price', '3️⃣ You approve', '4️⃣ Rider delivers 🛵'].map((s) => (
            <span key={s} className="rounded-full bg-white/15 px-2.5 py-1">{s}</span>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-ink-800">Mga hininging bili <span className="text-ink-400 font-bold">({items.length} item{items.length > 1 ? 's' : ''})</span></h3>
          <button type="button" onClick={addItem} disabled={items.length >= 15} className="px-3 py-1.5 bg-bayan-600 hover:bg-bayan-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl">＋ Add item</button>
        </div>

        {items.map((it, idx) => (
          <div key={idx} className="rounded-2xl border border-ink-100 bg-ink-50/50 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 shrink-0 rounded-full bg-bayan-600 text-white text-xs font-black flex items-center justify-center">{idx + 1}</span>
              <input value={it.product_name} onChange={setItem(idx, 'product_name')} placeholder="Ano ang gusto mong pabili? (e.g., Liptus 2L jerry can)" aria-label={`Item ${idx + 1} name`} className="field flex-1 bg-white" required={idx === 0} />
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(idx)} aria-label={`Remove item ${idx + 1}`} className="w-8 h-8 shrink-0 rounded-full bg-red-50 text-red-500 font-bold hover:bg-red-100">✕</button>
              )}
            </div>
            <input value={it.details} onChange={setItem(idx, 'details')} placeholder="Details — brand, size, taste, color… (optional)" aria-label={`Item ${idx + 1} details`} className="field bg-white" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={1} max={50} value={it.quantity} onChange={setItem(idx, 'quantity')} placeholder="Quantity" aria-label={`Item ${idx + 1} quantity`} className="field bg-white" />
              <input type="number" min={0} step="0.01" value={it.max_price} onChange={setItem(idx, 'max_price')} placeholder="Max budget ₱ (optional)" aria-label={`Item ${idx + 1} max budget`} className="field bg-white" />
            </div>
          </div>
        ))}

        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Extra note para sa kausap/merchant (optional)…" rows={2} className="field bg-white" />

        <div className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 text-xs">
          <span className="text-ink-500">🏠 Deliver to: <b className="text-ink-700">{profileAddr || '— set on Profile'}</b></span>
          <Link to="/customer/profile" className="font-bold text-bayan-700 hover:underline">Edit</Link>
        </div>

        <button type="submit" disabled={busy} className="w-full py-3 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white font-bold rounded-xl flex items-center justify-center gap-2">
          {busy && <Spinner size="sm" className="!text-white" />}
          {busy ? 'Sending…' : '🛒 I-pabili mo na!'}
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="font-extrabold text-ink-800 px-1">Aking mga hiling</h3>
        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-ink-200 rounded-xl animate-pulse-soft" />)}</div>
        ) : requests.length === 0 ? (
          <EmptyState icon="🧾" title="No pabili requests yet" hint="Your sent requests will appear here." />
        ) : (
          requests.map((r) => {
            const quoted = r.status === 'quoted';
            const grand = quoted ? (Number(r.quoted_total || 0) + Number(r.quoted_shipping || 0)) : 0;
            return (
              <div key={r.id} className="card p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-ink-800 text-sm">Pabili #{r.id} · {new Date(r.created_at).toLocaleString()}</p>
                  <span className={`chip border shrink-0 ${STATUS_STYLE[r.status] || 'bg-ink-100 text-ink-500'}`}>{STATUS_LABEL[r.status] || r.status}</span>
                </div>
                <ul className="text-xs text-ink-600 space-y-0.5">
                  {r.items.map((it) => (
                    <li key={it.id} className="flex items-baseline justify-between gap-2">
                      <span>• {it.product_name} ×{it.quantity}{it.details ? ` — ${it.details}` : ''}</span>
                      {it.quoted_price != null && <span className="font-black text-ink-800 shrink-0">₱{Number(it.quoted_price).toLocaleString()}</span>}
                    </li>
                  ))}
                </ul>
                {r.notes && <p className="text-[11px] text-ink-400">📝 {r.notes}</p>}
                {quoted && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 space-y-2">
                    <div className="grid gap-1 text-xs text-ink-600">
                      {r.items.filter((it) => it.staff_note).map((it) => <p key={it.id}>💬 {it.product_name}: <i>{it.staff_note}</i></p>)}
                      {r.quote_note && <p>💬 Note: <i>{r.quote_note}</i></p>}
                      <p className="flex justify-between"><span>Items</span><b>₱{Number(r.quoted_total || 0).toLocaleString()}</b></p>
                      <p className="flex justify-between"><span>Delivery</span><b>₱{Number(r.quoted_shipping || 0).toLocaleString()}</b></p>
                      <p className="flex justify-between text-sm border-t border-blue-200 pt-1"><span className="font-bold">Total (COD)</span><span className="font-black text-ink-800">₱{grand.toLocaleString()}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approve(r.id)} className="flex-1 py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl">✅ I-approve, bilhin niyo!</button>
                      <button onClick={() => decline(r.id)} className="px-3 py-2 bg-white border border-ink-200 hover:bg-ink-50 text-ink-600 text-xs font-bold rounded-xl">Decline</button>
                    </div>
                  </div>
                )}
                {r.quoted_by?.name && !quoted && <p className="text-[10px] text-ink-400">Quoted by {r.quoted_by.name}</p>}
                {r.status === 'converted' && r.order_id && (
                  <Link to={`/orders/${r.order_id}/track`} className="inline-block text-[11px] font-bold text-bayan-700 hover:underline">🛰 Track this order</Link>
                )}
                {r.status === 'pending' && (
                  <button onClick={() => cancel(r.id)} className="text-[11px] font-bold text-red-500 hover:underline">Cancel request</button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
