import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client.js';
import { Spinner, useToast } from '../../components/ui.jsx';

function Stars({ value, size = 'text-sm', onSelect, selected }) {
  const [hover, setHover] = useState(0);
  return (
    <div className={`flex items-center gap-0.5 ${size}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (selected ?? value ?? 0) >= n || (onSelect && hover >= n);
        return (
          <button
            key={n}
            type="button"
            disabled={!onSelect}
            onMouseEnter={() => onSelect && setHover(n)}
            onMouseLeave={() => onSelect && setHover(0)}
            onClick={() => onSelect?.(n)}
            className={onSelect ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
          >
            <span className={filled ? 'text-amber-400' : 'text-ink-200'}>{filled ? '★' : '☆'}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function ProductDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [related, setRelated] = useState([]);

  const load = () => {
    setLoading(true);
    client
      .get(`/products/${id}`)
      .then((res) => {
        setProduct(res.data.data || res.data);
        return client.get(`/products/${id}/related`).catch(() => ({ data: { related: [] } }));
      })
      .then((res) => setRelated(res.data?.related || []))
      .catch(() => notify('Product not found.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const addToCart = async () => {
    if (!user) {
      notify('Please log in to add items to your cart.', 'info');
      navigate('/login');
      return;
    }
    if (quantity < 1 || quantity > product.stock) {
      notify(`Please select 1–${product.stock} items.`, 'error');
      return;
    }
    setAdding(true);
    try {
      await client.post('/cart/sync', { cart: [{ product_id: product.id, quantity }] });
      notify(`Added ${quantity} × ${product.name} to cart.`, 'success');
    } catch {
      notify('Could not add to cart.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const submitReview = async () => {
    if (rating < 1) {
      notify('Please select a star rating.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await client.post(`/products/${id}/review`, {
        rating,
        review: reviewText.trim() || null,
      });
      notify('Thanks! Your review was submitted.');
      setRating(0);
      setReviewText('');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not submit review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="card p-6 text-center">
        <p className="text-ink-400">Product not found.</p>
        <button onClick={() => navigate('/market')} className="mt-3 px-4 py-2 bg-bayan-600 text-white text-xs font-bold rounded-xl">
          Back to marketplace
        </button>
      </div>
    );
  }

  const reviews = product.reviews || [];
  const gallery = product.images?.length
    ? product.images.map((i) => i.image_url)
    : product.image_url
    ? [product.image_url]
    : [];
  const salePct = product.sale_price ? Math.round((1 - Number(product.sale_price) / Number(product.price)) * 100) : 0;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="text-sm text-ink-500 hover:text-ink-700 font-bold flex items-center gap-1">
        ← Back
      </button>

      <div className="card overflow-hidden">
        <div className="relative h-56 bg-gradient-to-br from-bayan-100 to-ink-100 flex items-center justify-center overflow-hidden">
          {gallery.length ? (
            <img src={gallery[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl">🛍️</span>
          )}
          {product.sale_price && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full">
              {salePct}% OFF
            </span>
          )}
          {product.availability !== 'available' && (
            <span className="absolute top-2 right-2 bg-ink-800/80 text-white text-xs font-black px-2 py-1 rounded-full">
              {product.availability === 'out_of_stock' ? 'Out of stock' : 'Not available'}
            </span>
          )}
        </div>

        {gallery.length > 1 && (
          <div className="flex gap-2 p-3 border-t border-ink-100">
            {gallery.map((url, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${selectedImage === i ? 'border-bayan-600' : 'border-ink-100'}`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-ink-900">{product.name}</h1>
              {product.is_official_mall && (
                <span className="inline-block mt-1 bg-bayan-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  BeCoolBox Official
                </span>
              )}
            </div>
            <span className="chip border bg-ink-50 text-ink-500">{product.category}</span>
          </div>

          <p className="text-ink-600 text-sm leading-relaxed">{product.description || 'No description available.'}</p>

          <div className="flex items-baseline gap-3">
            {product.sale_price ? (
              <>
                <span className="text-sm text-ink-400 line-through">₱{Number(product.price).toLocaleString()}</span>
                <span className="text-3xl font-black text-red-600">₱{Number(product.sale_price).toLocaleString()}</span>
                <span className="text-xs font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full">ON SALE</span>
              </>
            ) : (
              <span className="text-3xl font-black text-ink-900">₱{Number(product.price).toLocaleString()}</span>
            )}
            <span className="text-sm text-ink-400">Stock: {product.stock}</span>
          </div>

          {/* Rating summary */}
          <div className="flex items-center gap-2">
            <Stars value={Number(product.average_rating || 0)} size="text-lg" />
            <span className="text-sm font-bold text-ink-800">{Number(product.average_rating || 0).toFixed(1)}</span>
            <span className="text-xs text-ink-400">({product.review_count || 0} reviews)</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {Number(product.suki_points_award) > 0 && (
              <div className="bg-bayan-50 rounded-xl p-3 text-center">
                <p className="text-xs text-ink-500">Suki Points</p>
                <p className="font-black text-bayan-700">+{product.suki_points_award}</p>
              </div>
            )}
            {Number(product.affiliate_percentage) > 0 && (
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-xs text-ink-500">Affiliate Share</p>
                <p className="font-black text-orange-600">{product.affiliate_percentage}%</p>
              </div>
            )}
            <div className="bg-ink-50 rounded-xl p-3 text-center">
              <p className="text-xs text-ink-500">Seller</p>
              <p className="font-bold text-ink-700 truncate">{product.merchant?.name || 'BayanBox'}</p>
            </div>
          </div>

          {/* Add to cart */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-ink-50 rounded-xl px-2 py-1.5">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-lg bg-white hover:bg-ink-100 disabled:opacity-40 font-bold text-sm transition"
              >
                −
              </button>
              <span className="w-8 text-center font-bold text-ink-800 text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="w-8 h-8 rounded-lg bg-white hover:bg-ink-100 disabled:opacity-40 font-bold text-sm transition"
              >
                +
              </button>
            </div>
            <button
              onClick={addToCart}
              disabled={adding || product.stock <= 0}
              className="flex-1 py-3 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white font-bold rounded-xl transition"
            >
              {adding ? 'Adding…' : product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
          <button
            onClick={() => navigate('/market')}
            className="w-full py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 font-bold rounded-xl transition text-sm"
          >
            Browse marketplace
          </button>
        </div>
      </div>

      {/* Review form — verified buyers only */}
      {product.can_review && (
        <div className="card p-4 space-y-3">
          <h3 className="font-extrabold text-ink-800">Rate this product</h3>
          <p className="text-xs text-ink-400">Only verified buyers can review. Thanks for supporting local sellers!</p>
          <div className="flex items-center gap-2">
            <Stars value={0} onSelect={setRating} selected={rating} size="text-2xl" />
            <span className="text-sm font-bold text-ink-700">{rating > 0 ? `${rating}/5` : 'Tap to rate'}</span>
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Share your experience (optional)…"
            className="field"
          />
          <button
            onClick={submitReview}
            disabled={submitting}
            className="px-4 py-2.5 bg-bayan-600 hover:bg-bayan-700 disabled:bg-ink-200 text-white text-sm font-bold rounded-xl"
          >
            {submitting ? 'Submitting…' : 'Submit review'}
          </button>
        </div>
      )}

      {/* Reviews list */}
      <div>
        <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">Reviews ({reviews.length})</h3>
        {reviews.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-ink-400 text-sm">No reviews yet. Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-ink-800 text-sm">{r.user?.name || 'Anonymous'}</p>
                  <Stars value={r.rating} size="text-sm" />
                </div>
                {r.review && <p className="text-sm text-ink-600">{r.review}</p>}
                <p className="text-[11px] text-ink-400 mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related products (item 1) */}
      {related.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider px-1 mb-2">
            You might also like
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {related.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/product/${r.id}`)}
                className="card p-2 w-36 shrink-0 text-left transition hover:shadow-lift"
              >
                <div className="w-full h-20 rounded-lg bg-gradient-to-br from-bayan-100 to-ink-100 overflow-hidden flex items-center justify-center text-2xl mb-1.5">
                  {r.image_url || (r.images && r.images[0]?.image_url) ? (
                    <img src={r.image_url || r.images[0].image_url} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    '🛒'
                  )}
                </div>
                <h4 className="font-bold text-ink-800 text-xs line-clamp-1">{r.name}</h4>
                <p className="text-sm font-black text-ink-900 mt-0.5">
                  {r.sale_price ? (
                    <span className="text-red-600">₱{Number(r.sale_price).toLocaleString()}</span>
                  ) : (
                    `₱${Number(r.price).toLocaleString()}`
                  )}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}