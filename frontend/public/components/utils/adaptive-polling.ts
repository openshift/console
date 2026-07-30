export const MIN_POLL_DELAY = 15000;
export const MAX_POLL_DELAY = 60000;
export const EMA_ALPHA = 0.3;
export const SCALE_FACTOR = 10;

/** Converts a smoothed response time (EMA) to a clamped polling delay in ms. */
export const emaToDelay = (ema: number): number =>
  Number.isFinite(ema)
    ? Math.max(MIN_POLL_DELAY, Math.min(MAX_POLL_DELAY, Math.round(ema * SCALE_FACTOR)))
    : MIN_POLL_DELAY;

/**
 * Computes the next adaptive polling delay using an Exponential Moving Average
 * of response times. Returns `[nextDelay, updatedEma]`.
 *
 * On first call pass `previousEma` as 0 (or omit) to seed the EMA with `elapsedMs`.
 *
 * With current parameters (alpha=0.3, scale=10x, 15s–60s clamp):
 *   ~500ms response = 15s poll (floor)
 *   ~2s    response = 20s poll
 *   ~3s    response = 30s poll
 *   ~5s    response = 50s poll
 *   ~6s+   response = 60s poll (ceiling)
 */
export const computeAdaptiveDelay = (
  elapsedMs: number,
  previousEma: number = 0,
): [number, number] => {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return [MIN_POLL_DELAY, previousEma];
  }
  const ema = previousEma === 0 ? elapsedMs : EMA_ALPHA * elapsedMs + (1 - EMA_ALPHA) * previousEma;
  return [emaToDelay(ema), ema];
};
