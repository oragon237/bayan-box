import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import ImageUploader from '../../components/ImageUploader.jsx';
import { EmptyState, useToast } from '../../components/ui.jsx';

const EMPTY_FORM = {
  name: '', description: '', category: 'Packaging', price: '', stock: '',
  suki_points_award: 0, affiliate_percentage: 0, image_url: '', gallery: [],
};

const CATEGORIES = ['Packaging', 'Provincial Goods', 'Office Supplies', 'Promotional Items', 'Merchandise', 'Points Shop'];

export default function StaffMall({ user }) {
  const notify = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/staff/mall/inventory', { params: { per_page: 100 } });
      setItems(res.data.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await client.post('/staff/mall/products', {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        suki_points_award: Number(form.suki_points_award || 0),
        affiliate_percentage: Number(form.affiliate_percentage || 0),
        image_url: form.image_url || null,
        gallery: form.gallery.map((imageUrl) => ({ image_url: imageUrl })),
      });
      notify('Mall product published.');
      setForm(EMPTY_FORM);
      load();
    } catch (error) {
      notify(error.response?.data?.message || 'Could not publish this Mall product.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalStock = items.reduce((s, i) => s + Number(i.stock), 0);
  const lowStock = items.filter((i) => Number(i.stock) <= 10);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight">HABI Mall</h2>
            <p className="text-white/75 text-sm mt-1">Official inventory available for local hub pickup & over-the-counter.</p>
          </div>
          <button onClick={load} className="shrink-0 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold text-white hover:bg-white/25">↻ Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs text-ink-400 font-semibold uppercase">Total SKUs</p>
          <p className="text-2xl font-black text-ink-800">{items.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-400 font-semibold uppercase">Units in stock</p>
          <p className="text-2xl font-black text-ink-800">{totalStock}</p>
        </div>
      </div>

      <form onSubmit={submit} className="card p-4 space-y-3">
        <div>
          <h3 className="font-extrabold text-ink-800">Add Mall product</h3>
          <p className="mt-0.5 text-xs text-ink-400">Publish an item to the official HABI Mall catalogue.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-ink-500">Name *</label>
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g., Bulk Bubble Wrap (50m)" className="field" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-ink-500">Description</label>
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={2} className="field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-500">Category</label>
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="field bg-white">
              {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-500">Price (₱) *</label>
            <input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-500">Stock *</label>
            <input required type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className="field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-500">Suki points award</label>
            <input type="number" min="0" value={form.suki_points_award} onChange={(event) => setForm({ ...form, suki_points_award: event.target.value })} className="field" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-ink-500">Main image</label>
            <ImageUploader value={form.image_url} onChange={(imageUrl) => setForm({ ...form, image_url: imageUrl })} folder="products" label="Upload main image" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-ink-500">Gallery</label>
            <ImageUploader value={form.gallery} onChange={(gallery) => setForm({ ...form, gallery })} multiple folder="products" label="Add gallery images" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="rounded-xl bg-bayan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-bayan-700 disabled:bg-ink-200">
          {saving ? 'Publishing…' : 'Publish to HABI Mall'}
        </button>
      </form>

      {lowStock.length > 0 && (
        <div className="card p-4 border-amber-200 bg-amber-50">
          <p className="text-sm font-bold text-amber-800">⚠️ Low stock ({lowStock.length})</p>
          <p className="text-xs text-amber-700 mt-1">
            {lowStock.map((i) => i.name).join(', ')}
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3" />
      ) : items.length === 0 ? (
        <EmptyState icon="🏬" title="No mall inventory" hint="Admin has not published any HABI Mall products." />
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div key={p.id} className="card p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-bayan-500 to-bayan-700 flex items-center justify-center text-xl text-white shrink-0 overflow-hidden">
                {p.image_url || p.images?.[0]?.image_url ? <img src={p.image_url || p.images[0].image_url} alt="" className="h-full w-full object-cover" /> : '🛍️'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-ink-800 truncate">{p.name}</h4>
                <p className="text-xs text-ink-400">
                  ₱{Number(p.price).toLocaleString()} · {p.category}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`chip border ${Number(p.stock) <= 10 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}
                >
                  {p.stock} in stock
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
