import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client.js';
import { EmptyState } from '../../components/ui.jsx';

export default function ProvidersList({ user }) {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/providers');
      setProviders(res.data.providers || []);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5">
      <div className="dark-section rounded-3xl p-5 shadow-lift-dark relative overflow-hidden">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-bayan-600/30 blur-3xl" />
        <div className="relative">
          <h2 className="text-2xl font-black tracking-tight">Skilled Workers</h2>
          <p className="text-white/75 text-sm mt-1">Verified local providers for aircon cleaning, plumbing, electrical & more.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3" />
      ) : providers.length === 0 ? (
        <EmptyState icon="🧑‍🔧" title="No providers yet" hint="Skilled workers will appear here once verified." />
      ) : (
        <div className="space-y-3">
          {providers.map((p) => (
            <div key={p.id} className="card p-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-bayan-100 to-ink-100 overflow-hidden flex items-center justify-center text-2xl shrink-0">
                {p.picture_url ? (
                  <img src={p.picture_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  '🧑‍🔧'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h4 className="font-bold text-ink-800">{p.name}</h4>
                  {p.is_official && (
                    <span className="text-[9px] font-black bg-bayan-600 text-white px-1.5 py-0.5 rounded-full">
                      ✓ Official
                    </span>
                  )}
                  {p.is_verified && (
                    <span className="text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">
                      ✅ Verified
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {p.skills?.map((s) => (
                    <span key={s} className="text-[10px] font-semibold bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-amber-400 text-sm">{'★'.repeat(Math.round(Number(p.average_rating || 0)))}</span>
                  <span className="text-xs font-bold text-ink-700">{Number(p.average_rating || 0).toFixed(1)}</span>
                  <span className="text-[11px] text-ink-400">({p.review_count || 0} reviews)</span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/hire/${p.id}`)}
                className="shrink-0 px-4 py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl"
              >
                Hire
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}