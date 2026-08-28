import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import ImageUploader from '../../components/ImageUploader.jsx';
import { EmptyState, useToast } from '../../components/ui.jsx';

const EMPTY = { title: '', image_url: '', link_url: '', link_type: 'internal', sort_order: 0, is_active: true };

export default function AdminBanners({ user }) {
  const notify = useToast();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/admin/banners');
      setBanners(Array.isArray(res.data) ? res.data : []);
    } catch {
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.image_url) {
      notify('Title and image are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await client.put(`/admin/banners/${editingId}`, form);
        notify('Banner updated.');
      } else {
        await client.post('/admin/banners', form);
        notify('Banner created.');
      }
      setForm(EMPTY);
      setEditingId(null);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not save banner.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (b) => {
    setEditingId(b.id);
    setForm({ title: b.title, image_url: b.image_url, link_url: b.link_url || '', link_type: b.link_type || 'internal', sort_order: b.sort_order || 0, is_active: !!b.is_active });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggle = async (b) => {
    await client.put(`/admin/banners/${b.id}`, { is_active: !b.is_active }).catch(() => {});
    load();
  };

  const remove = async (b) => {
    await client.delete(`/admin/banners/${b.id}`).catch(() => {});
    notify('Banner deleted.');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Marketplace Banners</h2>
        <p className="text-white/75 text-sm mt-1">Upload promotional banners shown at the top of the marketplace.</p>
      </div>

      <form onSubmit={submit} className="card p-4 space-y-3">
        <h3 className="font-extrabold text-ink-800">{editingId ? 'Edit banner' : 'Add a banner'}</h3>
        <div>
          <label className="block text-xs font-semibold text-ink-500 mb-1">Title *</label>
          <input value={form.title} onChange={set('title')} placeholder="e.g., Summer Sale 50% Off" className="field" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-500 mb-1">Banner image *</label>
          <ImageUploader value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="banners" label="Upload banner image" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Link URL</label>
            <input value={form.link_url} onChange={set('link_url')} placeholder="/points-shop or https://…" className="field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Link type</label>
            <select value={form.link_type} onChange={set('link_type')} className="field bg-white">
              <option value="internal">Internal route</option>
              <option value="external">External URL</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Sort order</label>
            <input type="number" min="0" value={form.sort_order} onChange={set('sort_order')} className="field" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 pb-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-bayan-600" />
              <span className="text-xs font-bold text-ink-700">Active</span>
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="px-4 py-2.5 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-sm font-bold rounded-xl">
            {saving ? 'Saving…' : editingId ? 'Update banner' : 'Create banner'}
          </button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY); }} className="px-4 py-2.5 bg-ink-100 text-ink-700 text-sm font-bold rounded-xl">Cancel</button>}
        </div>
      </form>

      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Banners</h3>
        {loading ? (
          <div className="space-y-3" />
        ) : banners.length === 0 ? (
          <EmptyState icon="🖼️" title="No banners" hint="Create a banner to show it on the marketplace." />
        ) : (
          <div className="space-y-3">
            {banners.map((b) => (
              <div key={b.id} className="card p-3 flex items-center gap-3">
                <img src={b.image_url} alt={b.title} className="w-20 h-14 rounded-lg object-cover border border-ink-200 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink-800 text-sm truncate">{b.title}</p>
                  <p className="text-xs text-ink-400 truncate">{b.link_url || 'No link'} · order {b.sort_order}</p>
                  <span className={`chip border mt-1 ${b.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-ink-100 text-ink-500 border-ink-200'}`}>{b.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => startEdit(b)} className="px-3 py-1.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-bold rounded-lg">Edit</button>
                  <button onClick={() => toggle(b)} className="px-3 py-1.5 bg-bayan-50 hover:bg-bayan-100 text-bayan-700 text-xs font-bold rounded-lg">{b.is_active ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => remove(b)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}