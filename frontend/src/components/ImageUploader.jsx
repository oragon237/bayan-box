import { useRef, useState } from 'react';
import client from '../api/client.js';
import { useToast } from './ui.jsx';

/**
 * Reusable image upload control (Phase A).
 * Uploads a file to POST /api/upload, returns the optimized URL via onChange.
 * Supports multiple values for a gallery.
 */
export default function ImageUploader({ value, onChange, label = 'Product image', multiple = false, folder = 'products' }) {
  const notify = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const values = multiple ? value || [] : value ? [value] : [];

  const handleFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('folder', folder);
        const res = await client.post('/upload', fd);
        uploaded.push(res.data.image_url);
      }
      if (multiple) {
        onChange([...(value || []), ...uploaded]);
      } else {
        onChange(uploaded[0]);
      }
      notify(uploaded.length > 1 ? 'Images uploaded.' : 'Image uploaded.');
    } catch (err) {
      notify(err.response?.data?.message || 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const remove = (url) => {
    if (multiple) onChange((value || []).filter((u) => u !== url));
    else onChange(null);
  };

  return (
    <div className="space-y-2">
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((url) => (
            <div key={url} className="relative">
              <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover border border-ink-200" />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full py-2.5 bg-ink-100 hover:bg-ink-200 disabled:opacity-50 text-ink-700 text-xs font-bold rounded-xl border border-dashed border-ink-300"
      >
        {uploading ? 'Uploading…' : multiple ? '📷 Add images' : '📷 Upload image'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
        multiple={multiple}
        hidden
        onChange={(e) => {
          handleFiles(Array.from(e.target.files || []));
          e.target.value = '';
        }}
      />
    </div>
  );
}