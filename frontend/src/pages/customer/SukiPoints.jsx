import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { StatCard, EmptyState, Skeleton } from '../../components/ui.jsx';
import { StarIcon } from '../../components/icons.jsx';

const sign = (p) => (p >= 0 ? '+' : '');
const pointColor = (p) => (p >= 0 ? 'text-green-600' : 'text-red-600');
const pointBg = (p) => (p >= 0 ? 'bg-green-50' : 'bg-red-50');
const pointIcon = (p) => (p >= 0 ? '★' : '☆');

export default function SukiPoints({ user }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    client
      .get('/loyalty')
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black tracking-tight">Suki Points</h2>
        <p className="text-sm text-ink-400">Earn 1 point per parcel picked up within 24h of arrival.</p>
      </div>

      {/* Balance hero */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-6 text-white shadow-lift">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">Balance</span>
          <StarIcon className="w-5 h-5 text-white/70" />
        </div>
        <span className="text-5xl font-black tracking-tight">{data.balance}</span>
        <span className="block text-sm text-white/80 mt-1">points</span>
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Earn rate" value="1 pt" sub="per parcel pickup" />
        <StatCard label="Doorstep upgrade" value="50 pts" sub="upgrade delivery" />
      </div>

      {/* Ledger */}
      <div className="card p-4">
        <h3 className="font-bold text-ink-700 mb-3">Points Ledger</h3>
        {data.ledger?.length === 0 ? (
          <EmptyState
            title="No activity"
            hint="Pick up a parcel within 24h of arrival to earn points."
          />
        ) : (
          <div className="divide-y divide-ink-100">
            {data.ledger.map((p) => (
              <div key={p.id} className="py-3 flex items-center gap-3">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${pointBg(p.points)} ${pointColor(p.points)}`}>
                  {pointIcon(p.points)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{p.description}</div>
                  <div className="text-[11px] text-ink-400">
                    {p.type.replaceAll('_', ' ')} · {new Date(p.created_at).toLocaleString()} · balance {p.balance_after}
                  </div>
                </div>
                <span className={`font-black ${pointColor(p.points)}`}>
                  {sign(p.points)}{p.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}