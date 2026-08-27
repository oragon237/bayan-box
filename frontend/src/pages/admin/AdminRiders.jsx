import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { EmptyState, useToast } from '../../components/ui.jsx';

export default function AdminRiders({ user }) {
  const notify = useToast();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/admin/riders', { params: { per_page: 50 } });
      setRiders(res.data.data);
    } catch {
      setRiders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (r) => {
    setEditing(r);
    setForm({ name: r.name, email: r.email || '', municipality: r.municipality || '', status: r.status });
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      await client.put(`/admin/riders/${editing.id}`, form);
      notify('Rider updated.');
      setEditing(null);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Update failed.', 'error');
    }
  };

  const deactivate = async (r) => {
    try {
      await client.delete(`/admin/riders/${r.id}`);
      notify(`${r.name} deactivated.`);
      load();
    } catch (err) {
      notify('Could not deactivate.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">Riders</h2>
        <p className="text-white/75 text-sm mt-1">Manage delivery riders — view, edit, and deactivate.</p>
      </div>

      {editing && (
        <form onSubmit={save} className="card p-4 space-y-3">
          <h3 className="font-extrabold text-ink-800">Edit {editing.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Municipality</label>
              <input value={form.municipality} onChange={(e) => setForm({ ...form, municipality: e.target.value })} className="field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="field bg-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2.5 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-xl">
              Save
            </button>
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2.5 bg-ink-100 text-ink-700 text-sm font-bold rounded-xl">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3" />
      ) : riders.length === 0 ? (
        <EmptyState icon="🛵" title="No riders" hint="No rider accounts exist yet." />
      ) : (
        <div className="space-y-3">
          {riders.map((r) => (
            <div key={r.id} className="card p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-ink-100 flex items-center justify-center text-xl shrink-0">🛵</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-ink-800">{r.name}</h4>
                  <span className={`chip border ${r.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-ink-100 text-ink-500 border-ink-200'}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-ink-400 truncate">
                  📱 {r.phone} · {r.municipality || '—'}
                </p>
                <p className="text-[11px] text-ink-400">Active deliveries: {r.active_deliveries ?? 0}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => startEdit(r)} className="px-3 py-1.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-bold rounded-lg">
                  Edit
                </button>
                {r.status !== 'deactivated' && (
                  <button onClick={() => deactivate(r)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg">
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}