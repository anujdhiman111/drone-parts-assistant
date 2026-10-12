import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shouldAlert } from './change-detector';

describe('shouldAlert', () => {
  it('does not alert on the first snapshot', () => {
    assert.equal(shouldAlert(null, 'in_stock'), false);
  });

  it('alerts when status becomes in_stock', () => {
    assert.equal(shouldAlert('out_of_stock', 'in_stock'), true);
  });

  it('alerts when pre-order opens', () => {
    assert.equal(shouldAlert('out_of_stock', 'pre_order'), true);
  });

  it('does not alert on same status', () => {
    assert.equal(shouldAlert('in_stock', 'in_stock'), false);
  });

  it('does not alert when going out of stock', () => {
    assert.equal(shouldAlert('in_stock', 'out_of_stock'), false);
  });
});
