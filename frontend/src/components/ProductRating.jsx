export default function ProductRating({ average, count }) {
  const rating = Number(average);
  const reviews = Number(count);
  if (!Number.isInteger(reviews) || reviews <= 0) {
    return <span className="text-[11px] text-ink-500">No reviews yet</span>;
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return <span className="text-[11px] text-ink-500">{reviews} {reviews === 1 ? 'review' : 'reviews'}</span>;
  }
  return (
    <span className="text-[11px] text-ink-500" aria-label={`${rating.toFixed(1)} out of 5 from ${reviews} reviews`}>
      <span className="text-amber-500" aria-hidden="true">★</span> {rating.toFixed(1)} ({reviews})
    </span>
  );
}
