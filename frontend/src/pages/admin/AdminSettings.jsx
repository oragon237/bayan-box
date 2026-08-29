import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { useToast } from '../../components/ui.jsx';

const TABS = [
  { value: 'categories', label: '🏷️ Categories' },
  { value: 'fees', label: '💰 Fees & Rates' },
  { value: 'ads', label: '📢 Ad Pricing' },
  { value: 'locations', label: '📍 Service Locations' },
  { value: 'toggles', label: '⚙️ System Toggles' },
];

export default function AdminSettings({ user }) {
  const notify = useToast();
  const [tab, setTab] = useState('categories');
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [catModal, setCatModal] = useState(null); // {id?, name, icon, sort_order, is_active}
  const [catError, setCatError] = useState('');

  const load = async () => {
    try {
      const res = await client.get('/admin/settings');
      setSettings(res.data.settings);
      setCategories(res.data.categories);
    } catch {
      notify('Could not load settings.', 'error');
    }
  };

  useEffect(() => { load(); }, []);

  const setFees = (k) => (e) => setSettings((p) => ({ ...p, fees: { ...p.fees, [k]: Number(e.target.value) } }));
  const setAds = (k) => (e) => setSettings((p) => ({ ...p, ads: { ...p.ads, [k]: Number(e.target.value) } }));
  const setToggle = (k) => (e) => setSettings((p) => ({ ...p, toggles: { ...p.toggles, [k]: e.target.checked } }));
  const setLocCoord = (k) => (e) => setSettings((p) => ({ ...p, locations: { ...p.locations, [k]: Number(e.target.value) } }));

  const save = async () => {
    setSaving(true);
    try {
      await client.put('/admin/settings', settings);
      notify('Settings saved.');
    } catch (err) {
      notify(err.response?.data?.message || 'Could not save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveCategory = async () => {
    setCatError('');
    if (!catModal.name.trim()) { setCatError('Name is required.'); return; }
    try {
      const payload = { name: catModal.name, icon: catModal.icon || '📦', sort_order: Number(catModal.sort_order || 0), is_active: catModal.is_active };
      if (catModal.id) await client.put(`/admin/categories/${catModal.id}`, payload);
      else await client.post('/admin/categories', payload);
      notify('Category saved.');
      setCatModal(null);
      load();
    } catch (err) {
      setCatError(err.response?.data?.message || 'Could not save category.');
    }
  };

  const deleteCategory = async (c) => {
    try {
      await client.delete(`/admin/categories/${c.id}`);
      notify('Category deleted.');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not delete category.', 'error');
    }
  };

  const toggleZone = (i) => {
    setSettings((p) => {
      const zones = [...p.locations.service_zones];
      zones[i] = { ...zones[i], active: !zones[i].active };
      return { ...p, locations: { ...p.locations, service_zones: zones } };
    });
  };

  if (!settings) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-ink-400 animate-pulse-soft">Loading…</p></div>;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Admin Settings</h2>
        <p className="text-white/75 text-sm mt-1">Manage categories, fees, ad pricing, locations, and system toggles.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button key={t.value} onClick={() => setTab(t.value)} className={`chip border shrink-0 ${tab === t.value ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>{t.label}</button>
        ))}
      </div>

      {/* ── Categories tab ── */}
      {tab === 'categories' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-ink-500">{categories.length} categories</p>
            <button onClick={() => setCatModal({ name: '', icon: '📦', sort_order: 0, is_active: true })} className="px-4 py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl">+ Add category</button>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-ink-50 text-ink-500 font-bold uppercase tracking-wider"><th className="p-2 text-left">Icon</th><th className="p-2 text-left">Name / Slug</th><th className="p-2 text-right">Products</th><th className="p-2 text-right">Order</th><th className="p-2 text-center">Status</th><th className="p-2 text-right">Actions</th></tr></thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-t border-ink-50">
                    <td className="p-2 text-center text-lg">{c.icon}</td>
                    <td className="p-2"><span className="font-bold text-ink-800">{c.name}</span><span className="block text-[10px] text-ink-400">{c.slug}</span></td>
                    <td className="p-2 text-right font-bold">{c.product_count}</td>
                    <td className="p-2 text-right">{c.sort_order}</td>
                    <td className="p-2 text-center"><span className={`chip border ${c.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-ink-100 text-ink-500 border-ink-200'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="p-2 text-right whitespace-nowrap">
                      <button onClick={() => setCatModal(c)} className="px-2 py-1 bg-ink-100 hover:bg-ink-200 text-ink-700 font-bold rounded-lg mr-1">Edit</button>
                      <button onClick={() => deleteCategory(c)} className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Fees tab ── */}
      {tab === 'fees' && (
        <div className="space-y-4">
          <Field label="Base delivery fee (₱)" value={settings.fees.base_fee} onChange={setFees('base_fee')} />
          <Field label="Base distance threshold (km)" value={settings.fees.base_distance_km} onChange={setFees('base_distance_km')} />
          <Field label="Additional rate per km (₱/km)" value={settings.fees.per_km_rate} onChange={setFees('per_km_rate')} />
          <Field label="Merchant sales commission (%)" value={settings.fees.merchant_commission_percent} onChange={setFees('merchant_commission_percent')} />
          <Field label="Minimum affiliate cash-out (₱)" value={settings.fees.min_cashout} onChange={setFees('min_cashout')} />
        </div>
      )}

      {/* ── Ads tab ── */}
      {tab === 'ads' && (
        <div className="space-y-4">
          <Field label="Home slide ad rate (₱/day)" value={settings.ads.homepage_featured_rate} onChange={setAds('homepage_featured_rate')} />
          <Field label="Product search ad rate (₱/day)" value={settings.ads.sponsored_rate} onChange={setAds('sponsored_rate')} />
          <Field label="Max featured slots (banners)" value={settings.ads.max_featured_slots} onChange={setAds('max_featured_slots')} />
        </div>
      )}

      {/* ── Locations tab ── */}
      {tab === 'locations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Default center latitude" value={settings.locations.default_lat} onChange={setLocCoord('default_lat')} />
            <Field label="Default center longitude" value={settings.locations.default_lng} onChange={setLocCoord('default_lng')} />
          </div>
          <div>
            <p className="text-sm font-bold text-ink-500 uppercase tracking-wider mb-2">Service zones</p>
            <div className="space-y-2">
              {settings.locations.service_zones.map((z, i) => (
                <div key={i} className="card p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-ink-800 text-sm">{z.name}</p>
                    <p className="text-xs text-ink-400">{z.barangays.join(', ')}</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bold text-ink-600">{z.active ? 'Enabled' : 'Disabled'}</span>
                    <input type="checkbox" checked={z.active} onChange={() => toggleZone(i)} className="w-4 h-4 text-bayan-600" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Toggles tab ── */}
      {tab === 'toggles' && (
        <div className="space-y-3">
          <ToggleRow label="Emergency maintenance mode" desc="Restrict public marketplace access during upgrades" checked={settings.toggles.maintenance_mode} onChange={setToggle('maintenance_mode')} />
          <ToggleRow label="Allow new merchant registration" desc="Permit merchants to create new accounts" checked={settings.toggles.allow_merchant_registration} onChange={setToggle('allow_merchant_registration')} />
        </div>
      )}

      {/* Sticky save bar */}
      {tab !== 'categories' && (
        <div className="sticky bottom-24 z-30 flex justify-end">
          <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-sm font-bold rounded-xl shadow-lift transition">
            {saving ? 'Saving…' : '💾 Save Settings'}
          </button>
        </div>
      )}

      {/* Category modal */}
      {catModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setCatModal(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-extrabold text-ink-800">{catModal.id ? 'Edit category' : 'Add category'}</h3>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Name</label>
              <input value={catModal.name} onChange={(e) => setCatModal({ ...catModal, name: e.target.value })} placeholder="e.g., Fresh Produce" className="field" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Icon (emoji)</label>
                <input value={catModal.icon} onChange={(e) => setCatModal({ ...catModal, icon: e.target.value })} className="field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Display order</label>
                <input type="number" min="0" value={catModal.sort_order} onChange={(e) => setCatModal({ ...catModal, sort_order: e.target.value })} className="field" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={catModal.is_active} onChange={(e) => setCatModal({ ...catModal, is_active: e.target.checked })} className="w-4 h-4 text-bayan-600" />
              <span className="text-xs font-bold text-ink-700">Active</span>
            </label>
            {catError && <p className="text-xs text-red-600">{catError}</p>}
            <div className="flex gap-2">
              <button onClick={saveCategory} className="flex-1 py-2.5 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-xl">Save</button>
              <button onClick={() => setCatModal(null)} className="px-4 py-2.5 bg-ink-100 text-ink-700 text-sm font-bold rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-500 mb-1">{label}</label>
      <input type="number" step="0.01" value={value} onChange={onChange} className="field" />
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="card p-4 flex items-center justify-between">
      <div>
        <p className="font-bold text-ink-800 text-sm">{label}</p>
        <p className="text-xs text-ink-400">{desc}</p>
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} className="w-5 h-5 text-bayan-600" />
    </div>
  );
}