import client from '../api/client.js';
import { purchaseLoginUrl } from '../lib/purchaseJourney.js';
import { track } from './conversion.js';

export async function addProduct(product, quantity, user, navigate, notify) {
  if (!user) {
    notify('Sign in, then continue with your selected item and quantity.', 'info');
    navigate(purchaseLoginUrl(product.id, quantity));
    return false;
  }
  try {
    await client.post('/cart/items', { product_id: product.id, quantity });
    track('add_to_cart', { product_id: product.id, quantity });
    notify(`Added ${quantity} × ${product.name} to cart.`, 'success');
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      navigate(purchaseLoginUrl(product.id, quantity));
    }
    notify(error.response?.data?.message || 'Could not add to cart. Please try again.', 'error');
    return false;
  }
}
