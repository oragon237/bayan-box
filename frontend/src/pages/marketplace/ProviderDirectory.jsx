import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client.js';

const SKILLS = ['Aircon Cleaning', 'Plumbing', 'Electrical Repair', 'General Handyman', 'Carpentry', 'Painting', 'Roofing', 'Mechanic'];
const AVAILABILITY = [
  { value: 'available_now', label: 'Available Now', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'available_this_week', label: 'Available This Week', color: 'bg-bayan-50 text-bayan-700 border-bayan-200' },
  { value: 'schedule_ahead', label: 'Schedule Ahead', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'emergency', label: '24/7 Emergency', color: 'bg-red-50 text-red-600 border-red-200' },
];
const RADII = [5, 10, 25];

function SkeletonCard() {
  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-2xl bg-ink-200 animate-pulse-soft shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-ink-200 rounded animate-pulse-soft w-3/4" />
          <div className="h-3 bg-ink-200 rounded animate-pulse-soft w-1/2" />
          <div className="h-3 bg-ink-200 rounded animate-pulse-soft w-2/3" />
        </div>
      </div>
    </div>
  );
}

export default function ProviderDirectory({ user }) {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [skill, setSkill] = useState('');
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(10);
  const [availability, setAvailability] = useState('');
  const [sort, setSort] = useState('top_rated');
  const [view, setView] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const locationInput = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = async (reset = true) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const params = { per_page: 12, page: reset ? 1 : page, sort };
      if (debouncedQ.trim()) params.q = debouncedQ.trim();
      if (skill) params.skill = skill;
      if (location.trim()) params.location = location.trim();
      if (availability) params.availability = availability;
      const res = await client.get('/providers', { params });
      setProviders((prev) => (reset ? res.data.data : [...prev, ...res.data.data]));
      setHasMore(res.data.current_page < res.data.last_page);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { setPage(1); load(true); }, [debouncedQ, skill, location, availability, sort]);
  useEffect(() => { if (page > 1) load(false); }, [page]);

  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400 && hasMore && !loadingMore) setPage((p) => p + 1);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasMore, loadingMore]);

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => setLocation('Current Location'),
      () => setLocation('Naga City'),
    );
  };

  const resetFilters = () => {
    setQ(''); setSkill(''); setLocation(''); setRadius(10); setAvailability(''); setSort('top_rated');
  };

  const hasFilters = q || skill || location || availability;

  const availMeta = (val) => AVAILABILITY.find((a) => a.value === val) || AVAILABILITY[0];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="dark-section rounded-3xl p-5 shadow-lift-dark relative overflow-hidden">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-bayan-600/30 blur-3xl" />
        <div className="relative">
          <h2 className="text-2xl font-black tracking-tight">Skilled Workers</h2>
          <p className="text-white/75 text-sm mt-1">Find verified local providers for any job — home repairs, cleaning, and more.</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, job title, or skill…" aria-label="Search providers" className="field pr-9" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">🔍</span>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${showFilters ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-700 border-ink-200'}`} aria-label="Toggle filters">
            ⚙️ Filters
          </button>
        </div>

        {/* Filter drawer */}
        {showFilters && (
          <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-up">
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Skill</label>
              <select value={skill} onChange={(e) => setSkill(e.target.value)} aria-label="Skill" className="field bg-white">
                <option value="">All skills</option>
                {SKILLS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Location</label>
              <div className="flex gap-1">
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City / town" aria-label="Location" className="field flex-1" />
                <button onClick={useMyLocation} title="Use current location" aria-label="Use current location" className="px-2 py-1 bg-bayan-50 text-bayan-700 text-xs font-bold rounded-lg">📍</button>
              </div>
              <div className="flex gap-1 mt-1">
                {RADII.map((r) => (
                  <button key={r} onClick={() => setRadius(r)} className={`chip border ${radius === r ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}>{r}mi</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Availability</label>
              <select value={availability} onChange={(e) => setAvailability(e.target.value)} aria-label="Availability" className="field bg-white">
                <option value="">Any availability</option>
                {AVAILABILITY.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">Sort by</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" className="field bg-white">
                <option value="top_rated">⭐ Top Rated</option>
                <option value="top_viewed">👁 Most Viewed</option>
                <option value="closest">📍 Closest Distance</option>
                <option value="lowest_rate">₱ Lowest Hourly Rate</option>
              </select>
            </div>
          </div>
        )}

        {/* Active filter chips + view toggle */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {hasFilters && <button onClick={resetFilters} className="chip border bg-red-50 text-red-600 border-red-200 shrink-0">✕ Reset all</button>}
            {skill && <span className="chip border bg-bayan-50 text-bayan-700 border-bayan-200 shrink-0">{skill}</span>}
            {availability && <span className="chip border shrink-0">{availMeta(availability).label}</span>}
            {location && <span className="chip border bg-ink-50 text-ink-600 border-ink-200 shrink-0">📍 {location} · {radius}mi</span>}
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setView('grid')} aria-label="Grid view" className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center ${view === 'grid' ? 'bg-bayan-600 text-white' : 'bg-ink-100 text-ink-500'}`}>▦</button>
            <button onClick={() => setView('list')} aria-label="List view" className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center ${view === 'list' ? 'bg-bayan-600 text-white' : 'bg-ink-100 text-ink-500'}`}>☰</button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : providers.length === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <p className="text-5xl">🧑‍🔧</p>
          <p className="font-bold text-ink-800 text-lg">No workers found</p>
          <p className="text-sm text-ink-400">Try adjusting your filters or expanding your search radius.</p>
          <div className="flex gap-2 justify-center">
            <button onClick={resetFilters} className="px-4 py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl">Reset filters</button>
            <button onClick={() => setRadius(25)} className="px-4 py-2 bg-ink-100 text-ink-700 text-xs font-bold rounded-xl">Expand radius</button>
          </div>
        </div>
      ) : (
        <>
          <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {providers.map((p) => {
              const avail = availMeta(p.availability);
              return (
                <div key={p.id} className={`card p-4 flex ${view === 'list' ? 'sm:flex-row items-center gap-4' : 'flex-col'}`}>
                  <div className={`${view === 'list' ? 'w-20 h-20' : 'w-16 h-16'} rounded-2xl bg-gradient-to-br from-bayan-100 to-ink-100 overflow-hidden flex items-center justify-center text-3xl shrink-0 ${view === 'grid' ? 'mx-auto mb-3' : ''}`}>
                    {p.picture_url ? <img src={p.picture_url} alt={p.name} className="w-full h-full object-cover" /> : '🧑‍🔧'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-ink-800">{p.name}</h3>
                      {p.is_official && <span className="text-[9px] font-black bg-bayan-600 text-white px-1.5 py-0.5 rounded-full">✓ Official</span>}
                      {p.is_verified && <span className="text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">Verified</span>}
                    </div>
                    <p className="text-xs text-ink-400 mt-0.5">{p.skills?.[0] || 'Skilled Worker'} · {p.municipality || '—'}</p>

                    {/* Rating + stats */}
                    <div className="flex items-center gap-2 mt-1.5 text-xs">
                      <span className="font-black text-amber-500">{Number(p.average_rating || 0).toFixed(1)} ★</span>
                      <span className="text-ink-400">({p.review_count || 0} reviews)</span>
                      <span className="text-ink-400">· {p.completed_jobs || 0} jobs</span>
                      <span className="text-ink-400">· {p.profile_views || 0} views</span>
                    </div>

                    {/* Skills chips */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.skills?.slice(0, 3).map((s) => <span key={s} className="text-[10px] font-semibold bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full">{s}</span>)}
                    </div>

                    {/* Availability + rate */}
                    <div className="flex items-center justify-between mt-2">
                      <span className={`chip border ${avail.color}`}>{avail.label}</span>
                      <span className="text-sm font-black text-ink-900">{p.hourly_rate ? `₱${Number(p.hourly_rate)}/hr` : 'View rates'}</span>
                    </div>
                  </div>

                  <div className={`flex gap-2 ${view === 'list' ? 'flex-col shrink-0' : 'mt-3'}`}>
                    <button onClick={() => navigate(`/hire/${p.id}`)} className="flex-1 py-2 bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-bold rounded-xl" aria-label={`View ${p.name}'s profile`}>View Profile</button>
                    <button onClick={() => navigate(`/hire/${p.id}`)} className="flex-1 py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-xs font-bold rounded-xl">Book Now</button>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              {loadingMore ? <span className="w-7 h-7 border-2 border-bayan-600 border-t-transparent rounded-full animate-spin" /> : <button onClick={() => setPage((p) => p + 1)} className="px-6 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-sm font-bold rounded-xl">Load More</button>}
            </div>
          )}
        </>
      )}
    </div>
  );
}