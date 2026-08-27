import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'Packaging',
  price: '',
  stock: '',
  suki_points_award: 0,
  affiliate_percentage: 0,
  image_url: '',
};

export default function AdminMall({ user }) {
  const notify = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/admin/mall/products', { params: { per_page: 50 } });
      setProducts(res.data.data);
    } catch {
      setProducts([]);
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
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      suki_points_award: Number(form.suki_points_award || 0),
      affiliate_percentage: Number(form.affiliate_percentage || 0),
      image_url: form.image_url || null,
    };
    try {
      if (editingId) {
        await client.put(`/admin/mall/products/${editingId}`, payload);
        notify('Mall product updated.');
      } else {
        await client.post('/admin/mall/products', payload);
        notify('Mall product published to the storefront.');
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not save product.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description || '',
      category: p.category,
      price: p.price,
      stock: p.stock,
      suki_points_award: p.suki_points_award,
      affiliate_percentage: p.affiliate_percentage,
      image_url: p.image_url || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const archive = async (p) => {
    try {
      await client.delete(`/admin/mall/products/${p.id}`);
      notify('Mall product archived.');
      load();
    } catch {
      notify('Could not archive product.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="dark-section rounded-3xl p-5 shadow-lift-dark relative overflow-hidden">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-bayan-600/30 blur-3xl" />
        <div className="relative">
          <h2 className="text-2xl font-black tracking-tight">BeCoolBox Mall</h2>
          <p className="text-white/75 text-sm mt-1">
            Admin-owned flagship store. 100% of sales route to <b>admin_earnings</b> — 0% commission.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="card p-4 space-y-3">
        <h3 className="font-extrabold text-ink-800">{editingId ? 'Edit mall product' : 'Add a mall product'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-ink-500 mb-1">Name *</label>
            <input required value={form.name} onChange={set('name')} placeholder="e.g., Bulk Bubble Wrap (50m)" className="field" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-ink-500 mb-1">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2} className="field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Category</label>
            <input value={form.category} onChange={set('category')} placeholder="Packaging" className="field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Image URL</label>
            <input value={form.image_url} onChange={set('image_url')} placeholder="https://…" className="field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Price (₱) *</label>
            <input required type="number" min="0" step="0.01" value={form.price} onChange={set('price')} className="field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Stock *</label>
            <input required type="number" min="0" value={form.stock} onChange={set('stock')} className="field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Suki points award</label>
            <input type="number" min="0" value={form.suki_points_award} onChange={set('suki_points_award')} className="field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Affiliate % (0–50)</label>
            <input type="number" min="0" max="50" step="0.01" value={form.affiliate_percentage} onChange={set('affiliate_percentage')} className="field" />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={saving} className="px-4 py-2.5 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-sm font-bold rounded-xl">
            {saving ? 'Saving…' : editingId ? 'Update product' : 'Publish to storefront'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
              className="px-4 py-2.5 bg-ink-100 text-ink-700 text-sm font-bold rounded-xl"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Mall catalogue</h3>
        {loading ? (
          <div className="space-y-3" />
        ) : products.length === 0 ? (
          <EmptyState icon="🏬" title="No mall products" hint="Publish your first flagship item." />
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="card p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-bayan-500 to-bayan-700 flex items-center justify-center text-xl text-white shrink-0">🛍️</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-ink-800 truncate">{p.name}</h4>
                    <span className="chip border bg-bayan-50 text-bayan-700 border-bayan-200">Official</span>
                  </div>
                  <p className="text-xs text-ink-400 truncate">
                    ₱{Number(p.price).toLocaleString()} · {p.stock} in stock · {p.category}
                    {Number(p.suki_points_award) > 0 && ` · 🪙 +${p.suki_points_award}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(p)} className="px-3 py-1.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-bold rounded-lg">
                    Edit
                  </button>
                  {p.status === 'active' && (
                    <button onClick={() => archive(p)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg">
                      Archive
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}