import { useRef, useState } from 'react';
import client from '../api/client.js';
import { useToast } from './ui.jsx';

const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Reusable image upload control.
 * Click-to-upload or drag-and-drop, with type/size validation. Uploads to
 * POST /api/upload and returns the optimized URL via onChange.
 */
export default function ImageUploader({ value, onChange, label = 'Product image', multiple = false, folder = 'products' }) {
  const notify = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const values = multiple ? value || [] : value ? [value] : [];

  const validate = (file) => {
    if (!ACCEPT.includes(file.type)) {
      notify('Invalid file type. Use PNG, JPG, JPEG, WebP, or GIF.', 'error');
      return false;
    }
    if (file.size > MAX_SIZE) {
      notify('File too large. Maximum size is 5MB.', 'error');
      return false;
    }
    return true;
  };

  const handleFiles = async (files) => {
    const valid = Array.from(files).filter(validate);
    if (!valid.length) return;
    setUploading(true);
    const uploaded = [];
    try {
      for (const file of valid) {
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

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer?.files || []);
        }}
        onClick={() => inputRef.current?.click()}
        className={`w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
          dragging ? 'border-bayan-600 bg-bayan-50' : 'border-ink-300 bg-ink-50 hover:bg-ink-100'
        }`}
      >
        {uploading ? (
          <>
            <span className="w-6 h-6 border-2 border-bayan-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-ink-600">Uploading…</span>
          </>
        ) : (
          <>
            <span className="text-2xl">📷</span>
            <span className="text-xs font-bold text-ink-700">
              {multiple ? 'Click or drag images here' : 'Click or drag an image here'}
            </span>
            <span className="text-[10px] text-ink-400">PNG, JPG, JPEG, WebP · Max 5MB</span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(',')}
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