/** Fraction of browser tabs that send Segment events. */
const SAMPLE_RATE = 0.2;
const SAMPLE_KEY = 'console-telemetry-sample';

/** Result for this page load, in case session storage is unavailable. An
 * undefined value means that it has not been computed yet.
 */
let sampledForThisPageLoad: boolean | undefined;

/**
 * Returns whether this browser tab's Segment telemetry is sampled, currently
 * set at 20% chance.
 *
 * The decision is persisted in sessionStorage so reloads and SSO redirects
 * in the same tab keep the same outcome. A new tab gets a new independent
 * roll.
 *
 * Sampling exists for budget reasons OCPBUGS-54157. Consistency across
 * reloads is OCPBUGS-123211.
 *
 * If sessionStorage is unavailable, falls back to a single random decision
 * for this page load.
 *
 * @see https://redhat.atlassian.net/browse/OCPBUGS-123211
 * @returns `true` if this tab should send Segment events, `false` otherwise.
 */
export const isSessionSampled = (): boolean => {
  // Already decided for this page load? Return that.
  if (sampledForThisPageLoad !== undefined) {
    return sampledForThisPageLoad;
  }

  try {
    const stored: string | null = sessionStorage.getItem(SAMPLE_KEY);
    if (stored === '0') {
      sampledForThisPageLoad = false;
      return sampledForThisPageLoad;
    }

    if (stored === '1') {
      sampledForThisPageLoad = true;
      return sampledForThisPageLoad;
    }

    // First visit in this tab. Roll once, persist and memoize the result.
    const isSampled = Math.random() < SAMPLE_RATE;
    sessionStorage.setItem(SAMPLE_KEY, isSampled ? '1' : '0');

    sampledForThisPageLoad = isSampled;
    return sampledForThisPageLoad;
  } catch {
    // When session storage is unavailable, still memoize the result to avoid
    // having mismatched sampling in the same session.
    sampledForThisPageLoad = Math.random() < SAMPLE_RATE;
    return sampledForThisPageLoad;
  }
};
