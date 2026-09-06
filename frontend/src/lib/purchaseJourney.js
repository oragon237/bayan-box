export function safeReturnTo(value) {
  // Only internal storefront destinations, never arbitrary redirects or login loops.
  return typeof value === 'string' && /^\/(?:product\/\d+|store\/\d+|cart|search|mall|points-shop|customer\/profile)(?:\?[^#\\]*)?$/.test(value)
    && !/[\r\n\\]/.test(value) ? value : '/';
}

export function requestedQuantity(search) {
  const quantity = Number(new URLSearchParams(search).get('quantity'));
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 100 ? quantity : 1;
}

export function purchaseLoginUrl(productId, quantity = 1) {
  return '/login?return_to=' + encodeURIComponent(`/product/${productId}?quantity=${quantity}`);
}

export function cartCashSubtotal(items) {
  return Math.round(items.reduce((total, item) => total + (item.points_only ? 0 : Number(item.sale_price ?? item.price) * item.quantity), 0) * 100) / 100;
}
