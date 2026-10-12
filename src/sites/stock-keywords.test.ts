import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectStockStatusFromText, parseInrPrice } from './stock-keywords';

describe('detectStockStatusFromText', () => {
  it('detects pre-order before add-to-cart', () => {
    assert.equal(
      detectStockStatusFromText('Pre-order now. Add to cart'),
      'pre_order'
    );
  });

  it('detects out of stock', () => {
    assert.equal(detectStockStatusFromText('This product is Out of Stock'), 'out_of_stock');
  });

  it('detects in stock', () => {
    assert.equal(detectStockStatusFromText('In Stock. Add to Cart'), 'in_stock');
  });

  it('returns unknown when no keywords match', () => {
    assert.equal(detectStockStatusFromText('Product description only'), 'unknown');
  });
});

describe('parseInrPrice', () => {
  it('parses rupee amounts', () => {
    assert.equal(parseInrPrice('₹8,499.00'), 8499);
  });
});
