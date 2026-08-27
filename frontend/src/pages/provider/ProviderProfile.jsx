import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import ImageUploader from '../../components/ImageUploader.jsx';
import { useToast } from '../../components/ui.jsx';

const SKILL_OPTIONS = ['Aircon Cleaning', 'Plumbing', 'Electrical Repair', 'General Handyman', 'Carpentry', 'Painting', 'Roofing'];

function Stars({ value }) {
  return (
    <span className="text-amber-400">{'★'.repeat(Math.round(value))}</span>
  );
}

export default function ProviderProfile({ user }) {
  const notify = useToast();
  const [provider, setProvider] = useState(null);
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [pictureUrl, setPictureUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await client.get('/provider/profile');
      setProvider(res.data.provider);
      setProfile(res.data.profile);
      setSkills(res.data.profile?.skills || []);
      setPictureUrl(res.data.profile?.picture_url || '');
    } catch {
      notify('Could not load profile.', 'error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleSkill = (s) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const save = async () => {
    setSaving(true);
    try {
      await client.put('/provider/profile', {
        skills,
        picture_url: pictureUrl || null,
      });
      notify('Profile updated.');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!provider) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-ink-400 animate-pulse-soft">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="dark-section rounded-3xl p-5 shadow-lift-dark relative overflow-hidden">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-bayan-600/30 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 overflow-hidden flex items-center justify-center text-3xl shrink-0">
            {provider.picture_url ? (
              <img src={provider.picture_url} alt={provider.name} className="w-full h-full object-cover" />
            ) : (
              '🧑‍🔧'
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              {provider.name}
              {provider.is_official && (
                <span className="text-[10px] font-black bg-bayan-600 text-white px-2 py-0.5 rounded-full">
                  ✓ Official BeCoolBox Worker
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2 text-sm text-white/80 mt-1">
              <Stars value={Number(provider.average_rating || 0)} />
              <span className="font-bold">{Number(provider.average_rating || 0).toFixed(1)}</span>
              <span className="text-white/60">({provider.review_count} reviews)</span>
            </div>
            {provider.is_verified && (
              <span className="text-[10px] font-bold text-white/70 mt-0.5">✅ Verified provider</span>
            )}
          </div>
        </div>
      </div>

      {/* Profile picture */}
      <div className="card p-4 space-y-2">
        <h3 className="font-extrabold text-ink-800">Profile picture</h3>
        <ImageUploader value={pictureUrl} onChange={setPictureUrl} folder="providers" label="Upload picture" />
      </div>

      {/* Skills */}
      <div className="card p-4 space-y-3">
        <h3 className="font-extrabold text-ink-800">My skills</h3>
        <div className="flex flex-wrap gap-2">
          {SKILL_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSkill(s)}
              className={`chip border ${skills.includes(s) ? 'bg-bayan-600 text-white border-bayan-600' : 'bg-white text-ink-600 border-ink-200'}`}
            >
              {skills.includes(s) ? '✓ ' : ''}{s}
            </button>
          ))}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white font-bold rounded-xl"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>

      {/* Reviews */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Ratings & reviews</h3>
        {provider.review_count === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-ink-400 text-sm">No reviews yet. Great work earns you a 5-star rating!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Review list from detail endpoint */}
            <ProviderReviews providerId={provider.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function ProviderReviews({ providerId }) {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    client
      .get(`/providers/${providerId}/reviews`)
      .then((res) => setReviews(res.data.data || []))
      .catch(() => {});
  }, [providerId]);

  if (reviews.length === 0) return null;

  return reviews.map((r) => (
    <div key={r.id} className="card p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="font-bold text-ink-800 text-sm">{r.customer?.name || 'Customer'}</p>
        <Stars value={r.rating} />
      </div>
      {r.review && <p className="text-sm text-ink-600">{r.review}</p>}
      <p className="text-[11px] text-ink-400 mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
    </div>
  ));
}