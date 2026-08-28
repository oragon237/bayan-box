import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

const STATUS_STYLE = {
  active: 'bg-green-50 text-green-700 border-green-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  scheduled: 'bg-bayan-50 text-bayan-700 border-bayan-200',
  completed: 'bg-ink-100 text-ink-500 border-ink-200',
};

const TYPE_LABEL = {
  sponsored: 'Sponsored Search',
  homepage_featured: 'Homepage Featured',
  flash_deal: 'Flash Deal',
};

export default function MerchantAds({ user }) {
  const notify = useToast();
  const [searchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [rates, setRates] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ product_id: searchParams.get('product') || '', ad_type: 'sponsored', duration_days: 1, payment_method: 'wallet' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, rRes, pRes] = await Promise.all([
        client.get('/merchant/ads'),
        client.get('/merchant/ads/rates'),
        client.get('/merchant/products', { params: { per_page: 50 } }),
      ]);
      setCampaigns(cRes.data.campaigns || []);
      setRates(rRes.data.rates || []);
      setProducts(pRes.data.data || []);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rate = rates.find((r) => r.type === form.ad_type)?.daily_rate || 0;
  const total = Number(rate) * Number(form.duration_days);

  const launch = async () => {
    if (!form.product_id) { notify('Select a product.', 'error'); return; }
    setSaving(true);
    try {
      const res = await client.post('/merchant/ads', { ...form, product_id: Number(form.product_id), duration_days: Number(form.duration_days) });
      notify(res.data.message);
      setShowModal(false);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not launch ad.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const pause = async (c) => {
    await client.post(`/merchant/ads/${c.id}/pause`).catch(() => {});
    notify(c.status === 'paused' ? 'Resumed.' : 'Paused.');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Ads & Promotions</h2>
            <p className="text-white/75 text-sm mt-1">Boost your products across search and homepage.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-white text-bayan-700 text-sm font-bold rounded-xl">+ New Ad</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3" />
      ) : campaigns.length === 0 ? (
        <EmptyState icon="📢" title="No ad campaigns" hint="Create your first ad to boost a product." />
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={c.product?.image_url || 'https://placehold.co/100x100/673de6/ffffff?text=📦'} alt={c.product?.name} className="w-14 h-14 rounded-xl object-cover border border-ink-100" />
                  <div className="min-w-0">
                    <p className="font-bold text-ink-800 truncate">{c.product?.name}</p>
                    <p className="text-xs text-ink-400">{TYPE_LABEL[c.ad_type] || c.ad_type} · ₱{Number(c.daily_rate).toLocaleString()}/day</p>
                    <p className="text-[11px] text-ink-400">Ends {new Date(c.end_date).toLocaleDateString()} · {c.days_remaining} day(s) left</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`chip border ${STATUS_STYLE[c.status] || 'bg-ink-100'}`}>{c.status}</span>
                  <p className="text-sm font-black text-ink-800 mt-1">₱{Number(c.total_cost).toLocaleString()}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="bg-ink-50 rounded-xl p-2"><p className="text-lg font-black text-ink-800">{c.impressions}</p><p className="text-[10px] text-ink-400 uppercase">Impressions</p></div>
                <div className="bg-ink-50 rounded-xl p-2"><p className="text-lg font-black text-ink-800">{c.clicks}</p><p className="text-[10px] text-ink-400 uppercase">Clicks</p></div>
                <div className="bg-ink-50 rounded-xl p-2"><p className="text-lg font-black text-ink-800">{c.conversions}</p><p className="text-[10px] text-ink-400 uppercase">Orders</p></div>
              </div>

              {c.status === 'active' || c.status === 'paused' ? (
                <button onClick={() => pause(c)} className="mt-3 w-full py-2 bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-bold rounded-xl">
                  {c.status === 'paused' ? '▶ Resume' : '⏸ Pause'}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* New Ad modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-ink-800">Advertise Product</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-ink-100 text-ink-600 font-bold flex items-center justify-center">✕</button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Product</label>
              <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="field bg-white">
                <option value="">Select a product…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Promotion type</label>
              <div className="space-y-2">
                {rates.map((r) => (
                  <button key={r.type} onClick={() => setForm({ ...form, ad_type: r.type })} className={`w-full p-3 rounded-xl border text-left ${form.ad_type === r.type ? 'border-bayan-600 bg-bayan-50 ring-2 ring-bayan-500/30' : 'border-ink-200'}`}>
                    <p className="text-sm font-bold text-ink-800">{r.label}</p>
                    <p className="text-xs text-bayan-700 font-bold">₱{Number(r.daily_rate).toLocaleString()} / day</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Duration (days)</label>
              <select value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} className="field bg-white">
                {[1, 3, 7].map((d) => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Payment method</label>
              <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="field bg-white">
                <option value="wallet">Merchant Balance Wallet</option>
                <option value="points">Suki / Points Shop credits</option>
              </select>
            </div>

            <div className="bg-ink-50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-ink-600">Total cost</span>
              <span className="text-xl font-black text-ink-900">{form.payment_method === 'points' ? `🪙 ${total}` : `₱${total.toLocaleString()}`}</span>
            </div>

            <button onClick={launch} disabled={saving} className="w-full py-3 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white font-bold rounded-xl transition">
              {saving ? 'Launching…' : '🚀 Launch Ad Campaign'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}