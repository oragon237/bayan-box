import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client.js';
import ImageUploader from '../../components/ImageUploader.jsx';
import { EmptyState, useToast } from '../../components/ui.jsx';

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'General',
  price: '',
  sale_price: '',
  stock: '',
  suki_points_award: 0,
  affiliate_percentage: 0,
  image_url: '',
  gallery: [],
  availability: 'available',
};

const CATEGORIES = ['General', 'Fresh Produce', 'Home Cooks', 'Local Crafts', 'Packaging', 'Provincial Goods', 'Office Supplies'];

export default function MerchantProducts({ user }) {
  const notify = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const res = await client.get('/merchant/products', { params: { per_page: 20, page: p } });
      setProducts(res.data.data);
      setPage(res.data.current_page || p);
      setLastPage(res.data.last_page || 1);
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
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      sale_price: form.sale_price !== '' ? Number(form.sale_price) : null,
      stock: Number(form.stock),
      suki_points_award: Number(form.suki_points_award || 0),
      affiliate_percentage: Number(form.affiliate_percentage || 0),
      image_url: form.image_url || null,
      gallery: (form.gallery || []).map((u) => ({ image_url: u })),
      availability: form.availability || 'available',
    };
    try {
      if (editingId) {
        await client.put(`/merchant/products/${editingId}`, payload);
        notify('Product updated.');
      } else {
        await client.post('/merchant/products', payload);
        notify('Product uploaded to the marketplace.');
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
      sale_price: p.sale_price || '',
      stock: p.stock,
      suki_points_award: p.suki_points_award,
      affiliate_percentage: p.affiliate_percentage,
      image_url: p.image_url || '',
      gallery: (p.images || []).map((i) => i.image_url),
      availability: p.availability || 'available',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const archive = async (p) => {
    try {
      await client.delete(`/merchant/products/${p.id}`);
      notify('Product archived.');
      load();
    } catch {
      notify('Could not archive product.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">My Products</h2>
        <p className="text-white/75 text-sm mt-1">List your local goods with Suki rewards and affiliate shares.</p>
      </div>

      {/* Product form */}
      <form onSubmit={submit} className="card p-4 space-y-3">
        <h3 className="font-extrabold text-ink-800">{editingId ? 'Edit product' : 'Add a new product'}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-ink-500 mb-1">Name *</label>
            <input required value={form.name} onChange={set('name')} placeholder="e.g., Fresh Sili (250g)" className="field" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-ink-500 mb-1">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Describe your product…" className="field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Category</label>
            <select value={form.category} onChange={set('category')} className="field bg-white">
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Availability</label>
            <select value={form.availability} onChange={set('availability')} className="field bg-white">
              <option value="available">Available</option>
              <option value="out_of_stock">Out of stock</option>
              <option value="unavailable">Not available</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-ink-500 mb-1">Main image</label>
            <ImageUploader value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="products" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-ink-500 mb-1">Gallery</label>
            <ImageUploader
              value={form.gallery}
              onChange={(gallery) => setForm({ ...form, gallery })}
              multiple
              folder="products"
              label="Add gallery images"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Price (₱) *</label>
            <input required type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0.00" className="field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Sale price (₱) — ON SALE</label>
            <input type="number" min="0" step="0.01" value={form.sale_price} onChange={set('sale_price')} placeholder="Optional discount" className="field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Stock *</label>
            <input required type="number" min="0" value={form.stock} onChange={set('stock')} placeholder="0" className="field" />
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
          <button type="submit" disabled={saving} className="px-4 py-2.5 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-sm font-bold rounded-xl transition">
            {saving ? 'Saving…' : editingId ? 'Update product' : 'Upload product'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
              className="px-4 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-sm font-bold rounded-xl transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Product list */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Listed products</h3>
        {loading ? (
          <div className="space-y-3">{/* skeleton */}</div>
        ) : products.length === 0 ? (
          <EmptyState icon="🛍️" title="No products listed" hint="Upload your first product to appear on the storefront." />
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="card p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-bayan-100 to-ink-100 flex items-center justify-center text-xl shrink-0">🛒</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-ink-800 truncate">{p.name}</h4>
                    <span className={`chip border ${p.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-ink-100 text-ink-500 border-ink-200'}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-ink-400 truncate">
                    ₱{Number(p.price).toLocaleString()}{p.sale_price ? ` → ₱${Number(p.sale_price).toLocaleString()} ON SALE` : ''} · {p.stock} in stock · {p.category}
                    {Number(p.suki_points_award) > 0 && ` · 🪙 +${p.suki_points_award}`}
                    {Number(p.affiliate_percentage) > 0 && ` · 🔗 ${p.affiliate_percentage}%`}
                    · {p.availability === 'available' ? '✅ Available' : p.availability === 'out_of_stock' ? '📦 Out of stock' : '🚫 Unavailable'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(p)} className="px-3 py-1.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-bold rounded-lg">
                    Edit
                  </button>
                  <button onClick={() => navigate(`/merchant/ads?product=${p.id}`)} className="px-3 py-1.5 bg-bayan-50 hover:bg-bayan-100 text-bayan-700 text-xs font-bold rounded-lg">
                    📢 Advertise
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

        {lastPage > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => load(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-ink-100 hover:bg-ink-200 disabled:opacity-40 text-ink-700 text-xs font-bold rounded-lg"
            >
              ← Prev
            </button>
            <span className="text-xs font-bold text-ink-500">
              Page {page} of {lastPage}
            </span>
            <button
              onClick={() => load(page + 1)}
              disabled={page >= lastPage}
              className="px-3 py-1.5 bg-ink-100 hover:bg-ink-200 disabled:opacity-40 text-ink-700 text-xs font-bold rounded-lg"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}