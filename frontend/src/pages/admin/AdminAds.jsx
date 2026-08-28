import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import ImageUploader from '../../components/ImageUploader.jsx';
import { EmptyState, useToast } from '../../components/ui.jsx';

const STATUS_STYLE = {
  active: 'bg-green-50 text-green-700 border-green-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  scheduled: 'bg-bayan-50 text-bayan-700 border-bayan-200',
  completed: 'bg-ink-100 text-ink-500 border-ink-200',
};

const TYPE_LABEL = { sponsored: 'Sponsored', homepage_featured: 'Homepage', flash_deal: 'Flash Deal' };

export default function AdminAds({ user }) {
  const notify = useToast();
  const [tab, setTab] = useState('product');
  const [ads, setAds] = useState([]);
  const [counters, setCounters] = useState({ total: 0, active: 0, paused: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/admin/ads', { params: { type: tab } });
      setAds(res.data.data || []);
      setCounters({ total: res.data.total, active: res.data.active, paused: res.data.paused, expired: res.data.expired });
    } catch {
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const startEdit = (ad) => {
    setEditing(ad);
    setForm({
      type: ad.type,
      title: ad.title || '',
      status: ad.status || 'active',
      display_order: ad.display_order || ad.sort_order || 0,
      start_date: ad.start_date ? ad.start_date.slice(0, 16) : '',
      end_date: ad.end_date ? ad.end_date.slice(0, 16) : '',
      // Home slide fields
      image_url: ad.image_url || '',
      link_url: ad.link_url || '',
      // Product ad fields
      ad_type: ad.ad_type || 'sponsored',
      keywords: ad.keywords || '',
      daily_rate: ad.daily_rate || 0,
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        title: form.title,
        status: form.status,
        display_order: Number(form.display_order || 0),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        image_url: form.image_url || null,
        link_url: form.link_url || null,
        ad_type: form.ad_type,
        keywords: form.keywords || null,
        daily_rate: Number(form.daily_rate || 0),
      };
      await client.put(`/admin/ads/${editing.id}`, payload);
      notify('Ad updated.');
      setEditing(null);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not update ad.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const quickToggle = async (ad) => {
    const next = ad.status === 'active' ? 'paused' : 'active';
    await client.put(`/admin/ads/${ad.id}`, { type: ad.type, status: next }).catch(() => {});
    notify(next === 'active' ? 'Ad activated.' : 'Ad paused.');
    load();
  };

  const confirmDelete = async () => {
    await client.delete(`/admin/ads/${deleting.id}`, { data: { type: deleting.type } }).catch(() => {});
    notify('Ad deleted.');
    setDeleting(null);
    load();
  };

  const Counter = ({ label, value }) => (
    <div className="card px-3 py-2 text-center"><p className="text-lg font-black text-ink-800">{value}</p><p className="text-[10px] text-ink-400 uppercase">{label}</p></div>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Advertisements</h2>
        <p className="text-white/75 text-sm mt-1">Manage product ads and homepage slide ads.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ value: 'product', label: '📢 Product Ads' }, { value: 'home_slide', label: '🖼️ Home Slide Ads' }].map((t) => (
          <button key={t.value} onClick={() => { setTab(t.value); setEditing(null); }} className={`chip border ${tab === t.value ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>{t.label}</button>
        ))}
      </div>

      {/* Filter summary */}
      <div className="grid grid-cols-4 gap-2">
        <Counter label="Total" value={counters.total} />
        <Counter label="Active" value={counters.active} />
        <Counter label="Paused" value={counters.paused} />
        <Counter label="Expired" value={counters.expired} />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3" />
      ) : ads.length === 0 ? (
        <EmptyState icon="📢" title="No ads" hint={tab === 'product' ? 'Merchant ad campaigns will appear here.' : 'Homepage slide ads will appear here.'} />
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <div key={ad.id} className="card p-4">
              <div className="flex items-start gap-3">
                {ad.image_url ? (
                  <img src={ad.image_url} alt={ad.title} className="w-16 h-14 rounded-lg object-cover border border-ink-100 shrink-0" />
                ) : (
                  <div className="w-16 h-14 rounded-lg bg-gradient-to-br from-bayan-100 to-ink-100 flex items-center justify-center text-2xl shrink-0">📦</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-ink-800 text-sm truncate">{ad.title}</p>
                    <span className={`chip border ${STATUS_STYLE[ad.status] || 'bg-ink-100'}`}>{ad.status}</span>
                  </div>
                  {ad.type === 'product' && (
                    <p className="text-xs text-ink-400 truncate">
                      {ad.product?.name} · {TYPE_LABEL[ad.ad_type] || ad.ad_type} · ₱{Number(ad.daily_rate).toLocaleString()}/day · {ad.merchant?.name}
                    </p>
                  )}
                  {ad.type === 'home_slide' && <p className="text-xs text-ink-400 truncate">→ {ad.link_url || 'No link'} · order {ad.display_order}</p>}
                  <div className="flex gap-3 mt-1 text-[10px] text-ink-400">
                    <span>{ad.impressions} impressions</span><span>{ad.clicks} clicks</span>
                    {ad.end_date && <span>Ends {new Date(ad.end_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => startEdit(ad)} className="px-3 py-1.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-bold rounded-lg">✏️ Edit</button>
                  <button onClick={() => quickToggle(ad)} className="px-3 py-1.5 bg-bayan-50 hover:bg-bayan-100 text-bayan-700 text-xs font-bold rounded-lg">{ad.status === 'active' ? '⏸ Pause' : '▶ Activate'}</button>
                  <button onClick={() => setDeleting(ad)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg">🗑 Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setEditing(null)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-3 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-ink-800">Edit Advertisement</h3>
              <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-full bg-ink-100 text-ink-600 font-bold flex items-center justify-center">✕</button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Ad title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="field" />

              {/* Image upload + preview */}
              <div className="mt-3">
                <label className="block text-xs font-semibold text-ink-500 mb-1">
                  {form.type === 'home_slide' ? 'Banner image *' : 'Product image'}
                </label>
                <ImageUploader value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="ads" label="Upload image" />
                <div className="mt-2 text-xs text-ink-500 bg-ink-50 p-2 rounded-md">
                  {form.type === 'home_slide' ? (
                    <>💡 Recommended: <b>1200 × 450px</b> or <b>1200 × 400px</b> (3:1 / 16:6) · WebP, PNG, JPG · Max 2MB</>
                  ) : (
                    <>💡 Recommended: <b>500 × 500px</b> or <b>800 × 800px</b> (1:1 square) · WebP, PNG, JPG · Max 2MB</>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="field bg-white">
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed / Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Display order</label>
                <input type="number" min="0" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} className="field" />
              </div>
            </div>

            {form.type === 'home_slide' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">CTA link / route</label>
                  <input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} className="field" />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink-500 mb-1">Ad type</label>
                    <select value={form.ad_type} onChange={(e) => setForm({ ...form, ad_type: e.target.value })} className="field bg-white">
                      <option value="sponsored">Sponsored</option>
                      <option value="homepage_featured">Homepage Featured</option>
                      <option value="flash_deal">Flash Deal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-500 mb-1">Daily budget (₱)</label>
                    <input type="number" min="0" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: e.target.value })} className="field" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Target keywords</label>
                  <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} className="field" />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Start date</label>
                <input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">End date</label>
                <input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="field" />
              </div>
            </div>

            <button onClick={save} disabled={saving} className="w-full py-3 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white font-bold rounded-xl transition">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDeleting(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl">🗑️</div>
            <h3 className="font-extrabold text-ink-800">Delete this ad campaign?</h3>
            <p className="text-sm text-ink-500">Are you sure you want to delete "{deleting.title}"?</p>
            <div className="flex gap-2">
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl">Delete</button>
              <button onClick={() => setDeleting(null)} className="flex-1 py-2.5 bg-ink-100 text-ink-700 text-sm font-bold rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}