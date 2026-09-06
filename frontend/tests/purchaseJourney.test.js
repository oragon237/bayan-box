import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeReturnTo, requestedQuantity, purchaseLoginUrl, cartCashSubtotal } from '../src/lib/purchaseJourney.js';

test('login link preserves product and quantity through URL encoding and reload', () => {
  const login = new URL(purchaseLoginUrl(24, 3), 'https://example.test');
  const destination = safeReturnTo(login.searchParams.get('return_to'));
  assert.equal(destination, '/product/24?quantity=3');
  assert.equal(requestedQuantity(new URL(destination, login).search), 3);
  assert.equal(safeReturnTo('/cart'), '/cart');
});

test('external redirects, login loops and malformed quantities fail safely', () => {
  for (const url of ['https://evil.test', '//evil.test', '/\\evil.test', '/login', '/admin/dashboard', null]) assert.equal(safeReturnTo(url), '/');
  for (const query of ['', '?quantity=-1', '?quantity=101', '?quantity=1.2', '?quantity=NaN']) assert.equal(requestedQuantity(query), 1);
});

test('cash subtotal uses sale prices and excludes points-only rewards', () => {
  assert.equal(cartCashSubtotal([
    { price: '60.00', sale_price: '50.00', quantity: 2 },
    { price: '80.00', sale_price: null, quantity: 1 },
    { price: '100.00', points_only: true, quantity: 1 },
  ]), 180);
  assert.equal(cartCashSubtotal([{ price: '10.00', sale_price: '0.00', quantity: 1 }]), 0);
});
