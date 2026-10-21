import {
  computeAdaptiveDelay,
  emaToDelay,
  MIN_POLL_DELAY,
  MAX_POLL_DELAY,
  EMA_ALPHA,
  SCALE_FACTOR,
} from '../adaptive-polling';

describe('emaToDelay', () => {
  it('clamps to MIN_POLL_DELAY for small EMA values', () => {
    expect(emaToDelay(0)).toBe(MIN_POLL_DELAY);
    expect(emaToDelay(500)).toBe(MIN_POLL_DELAY);
    expect(emaToDelay(1499)).toBe(MIN_POLL_DELAY);
  });

  it('scales proportionally for mid-range EMA values', () => {
    expect(emaToDelay(2000)).toBe(20000);
    expect(emaToDelay(3000)).toBe(30000);
    expect(emaToDelay(4500)).toBe(45000);
  });

  it('clamps to MAX_POLL_DELAY for large EMA values', () => {
    expect(emaToDelay(6000)).toBe(MAX_POLL_DELAY);
    expect(emaToDelay(10000)).toBe(MAX_POLL_DELAY);
  });

  it('falls back to MIN_POLL_DELAY for non-finite values', () => {
    expect(emaToDelay(NaN)).toBe(MIN_POLL_DELAY);
    expect(emaToDelay(Infinity)).toBe(MIN_POLL_DELAY);
    expect(emaToDelay(-Infinity)).toBe(MIN_POLL_DELAY);
  });
});

describe('computeAdaptiveDelay', () => {
  it('uses elapsed directly as EMA on first call (previousEma = 0)', () => {
    const [delay, ema] = computeAdaptiveDelay(500, 0);
    expect(ema).toBe(500);
    expect(delay).toBe(MIN_POLL_DELAY);
  });

  it('applies EMA smoothing with previous value', () => {
    const [, ema] = computeAdaptiveDelay(4000, 3000);
    const expected = EMA_ALPHA * 4000 + (1 - EMA_ALPHA) * 3000;
    expect(ema).toBe(expected);
  });

  it('returns MIN_POLL_DELAY for fast responses', () => {
    const [delay] = computeAdaptiveDelay(200, 300);
    expect(delay).toBe(MIN_POLL_DELAY);
  });

  it('returns proportional delay for moderate responses', () => {
    const [delay, ema] = computeAdaptiveDelay(3000, 3000);
    expect(ema).toBe(3000);
    expect(delay).toBe(30000);
  });

  it('returns MAX_POLL_DELAY for very slow responses', () => {
    const [delay] = computeAdaptiveDelay(10000, 8000);
    expect(delay).toBe(MAX_POLL_DELAY);
  });

  it('dampens a single outlier spike via EMA smoothing', () => {
    // Stable at 1s, then a 10s spike
    const [, ema1] = computeAdaptiveDelay(1000, 1000);
    expect(ema1).toBe(1000);

    const [delay, ema2] = computeAdaptiveDelay(10000, ema1);
    const expected = EMA_ALPHA * 10000 + (1 - EMA_ALPHA) * 1000;
    expect(ema2).toBe(expected);
    // Should not jump to MAX_POLL_DELAY from a single spike
    expect(delay).toBeLessThan(MAX_POLL_DELAY);
  });

  it('recovers gradually after error backoff', () => {
    const errorInput = MAX_POLL_DELAY / SCALE_FACTOR;
    // Start from stable fast state
    const [, emaAfterError] = computeAdaptiveDelay(errorInput, 500);
    expect(emaAfterError).toBeGreaterThan(500);

    // Follow up with a fast response — EMA should decrease
    const [, emaRecovery] = computeAdaptiveDelay(500, emaAfterError);
    expect(emaRecovery).toBeLessThan(emaAfterError);
  });

  it('defaults previousEma to 0 when omitted', () => {
    const [delay, ema] = computeAdaptiveDelay(2000);
    expect(ema).toBe(2000);
    expect(delay).toBe(20000);
  });

  it('falls back safely for non-finite or negative elapsedMs', () => {
    expect(computeAdaptiveDelay(NaN, 1000)).toEqual([MIN_POLL_DELAY, 1000]);
    expect(computeAdaptiveDelay(Infinity, 1000)).toEqual([MIN_POLL_DELAY, 1000]);
    expect(computeAdaptiveDelay(-1, 1000)).toEqual([MIN_POLL_DELAY, 1000]);
  });
});
