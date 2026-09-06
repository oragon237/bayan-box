import { useEffect, useState } from 'react';
import client from '../api/client.js';

export default function ConversionReport() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => { client.get('/admin/conversions').then(({ data }) => setData(data)).catch(() => setError(true)); }, []);
  const labels = { visit: 'Storefront visits', view_item: 'Product views', add_to_cart: 'Added to cart', begin_checkout: 'Checkout attempts', order_placed: 'Orders placed', checkout_error: 'Checkout errors' };
  return (
    <section className="card p-4 space-y-3">
      <h3 className="font-bold text-ink-800">Shopping conversions · Last 30 days</h3>
      {error ? <p className="text-sm text-red-600">Conversion report unavailable. Check that database migrations have been applied.</p> : !data ? <p>Loading conversions…</p> : <>
        <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr><th>Stage</th><th>Events</th><th>Sessions</th></tr></thead><tbody>
          {Object.entries(labels).map(([event, label]) => {
            const row = data.stages.find((row) => row.event === event);
            return <tr key={event}><td className="py-1">{label}</td><td>{row?.events || 0}</td><td>{row?.sessions || 0}</td></tr>;
          })}
        </tbody></table></div>
        <p className="text-sm">Completed / delivered tracked orders: <strong>{data.completed_orders}</strong></p>
        <p className="text-xs text-ink-500">Session activity, not a sequential funnel. Checkout attempts may repeat. Orders placed are confirmed by the server; payment or delivery may still be pending. Tracking begins after this update.</p>
        <h4 className="font-bold text-sm">Orders by campaign</h4>
        {data.sources.length ? <ul className="text-sm space-y-1">{data.sources.map((row, index) => <li key={index}>{row.utm_source || 'Direct / untagged'} · {row.utm_medium || '—'} · {row.utm_campaign || '—'}: <strong>{row.orders}</strong></li>)}</ul> : <p className="text-sm text-ink-500">No tracked orders yet.</p>}
      </>}
    </section>
  );
}
