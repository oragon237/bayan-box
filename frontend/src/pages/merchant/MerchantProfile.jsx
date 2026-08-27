import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import ImageUploader from '../../components/ImageUploader.jsx';
import { useToast } from '../../components/ui.jsx';

export default function MerchantProfile({ user }) {
  const notify = useToast();
  const [profile, setProfile] = useState(null);
  const [docs, setDocs] = useState({});
  const [form, setForm] = useState({
    barangay: '',
    municipality: '',
    dti_sec_number: '',
    government_id_url: '',
    business_permit_url: '',
    picture_url: '',
    verification_message: '',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await client.get('/merchant/profile');
      setProfile(res.data.merchant);
      setDocs(res.data.documents);
      setForm({
        barangay: res.data.merchant.barangay || '',
        municipality: res.data.merchant.municipality || '',
        dti_sec_number: res.data.documents.dti_sec_number || '',
        government_id_url: res.data.documents.government_id_url || '',
        business_permit_url: res.data.documents.business_permit_url || '',
        picture_url: res.data.documents.picture_url || '',
        verification_message: res.data.documents.verification_message || '',
      });
    } catch {
      notify('Could not load profile.', 'error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const save = async () => {
    setSaving(true);
    try {
      await client.put('/merchant/profile', form);
      notify('Profile updated. Admin can review your documents.');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-ink-400 animate-pulse-soft">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-bayan-700 to-bayan-500 text-white p-5 shadow-lift">
        <h2 className="text-2xl font-black tracking-tight">My Profile</h2>
        <p className="text-white/75 text-sm mt-1">
          Manage your verification documents, address, and business details for admin review.
        </p>
      </div>

      <div className="card p-4 space-y-4">
        {/* Merchant photo */}
        <div>
          <label className="block text-xs font-semibold text-ink-500 mb-1">Merchant photo</label>
          <ImageUploader value={form.picture_url} onChange={(url) => setForm({ ...form, picture_url: url })} folder="merchants" label="Upload photo" />
        </div>

        {/* DTI/SEC */}
        <div>
          <label className="block text-xs font-semibold text-ink-500 mb-1">DTI / SEC registration number</label>
          <input value={form.dti_sec_number} onChange={set('dti_sec_number')} placeholder="e.g., DTI-2026-12345" className="field" />
        </div>

        {/* Government ID */}
        <div>
          <label className="block text-xs font-semibold text-ink-500 mb-1">Government ID (image)</label>
          <ImageUploader value={form.government_id_url} onChange={(url) => setForm({ ...form, government_id_url: url })} folder="merchants" label="Upload government ID" />
        </div>

        {/* Business permit */}
        <div>
          <label className="block text-xs font-semibold text-ink-500 mb-1">Business permit (image)</label>
          <ImageUploader value={form.business_permit_url} onChange={(url) => setForm({ ...form, business_permit_url: url })} folder="merchants" label="Upload business permit" />
        </div>

        {/* Address */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Barangay</label>
            <input value={form.barangay} onChange={set('barangay')} placeholder="e.g., San Jose" className="field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Municipality</label>
            <input value={form.municipality} onChange={set('municipality')} placeholder="e.g., Naga City" className="field" />
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-ink-500 mb-1">Message / notes (for admin)</label>
          <textarea
            value={form.verification_message}
            onChange={set('verification_message')}
            rows={3}
            maxLength={500}
            placeholder="Add any additional verification notes…"
            className="field"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white font-bold rounded-xl transition"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </div>
  );
}