/**
 * Whether the given URL uses the HTTPS protocol.
 * @param url the URL to validate. Callers must handle an undefined URL separately.
 * @returns `true` when the URL uses HTTPS, `false` otherwise.
 */
export const isHttpsCdnUrl = (url: string): boolean => {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Normalizes the given URL.
 * @param url the URL to be normalized.
 * @returns the given URL with the `https` protocol prepended and no trailing
 * slashes, or `undefined` when the URL is not HTTPS.
 */
const normalizeCdnUrl = function (url: string): string | undefined {
  let sanitizedUrl: string;

  if (url.startsWith('//')) {
    return undefined;
  }

  if (url.startsWith('https://')) {
    sanitizedUrl = url;
  } else if (url.startsWith('http://')) {
    return undefined;
  } else {
    sanitizedUrl = `https://${url}`;
  }

  const normalized = sanitizedUrl.replace(/\/+$/, '');
  if (!isHttpsCdnUrl(normalized)) {
    return undefined;
  }

  return normalized;
};

/**
 * Whether a Segment CDN override is configured in telemetry settings.
 * @returns `true` when any CDN override key is present.
 */
export const hasSegmentCdnOverride = function (): boolean {
  const { telemetry } = window.SERVER_FLAGS;
  return !!(telemetry?.SEGMENT_CDN_URL || telemetry?.SEGMENT_JS_URL || telemetry?.SEGMENT_JS_HOST);
};

/**
 * Resolve the CDN URL for Segment.
 * @returns `undefined` for when the `telemetry` segment is not present, no CDN
 * override is configured, or a configured override cannot be normalized to a
 * valid HTTPS URL. Otherwise, it returns one of the following three in the
 * following order: the `SEGMENT_CDN_URL`, the `SEGMENT_JS_URL` by stripping
 * anything that goes after the "/analytics.js/v1" part, or the `SEGMENT_JS_HOST`
 * by making sure that it has an `https` protocol defined.
 */
export const resolveSegmentCdnUrl = function (): string | undefined {
  const { telemetry } = window.SERVER_FLAGS;
  if (!telemetry) {
    return undefined;
  }

  // The newly defined CDN URL takes preference if it is set.
  if (telemetry.SEGMENT_CDN_URL) {
    const normalizedCdnUrl = normalizeCdnUrl(telemetry.SEGMENT_CDN_URL);
    if (!normalizedCdnUrl) {
      return undefined;
    }

    return normalizedCdnUrl;
  }

  // If present, take the "SEGMENT_JS_URL" and strip the "/analytics.js/v1"
  // part which is not required for the CDN URL. The old code either took the
  // "SEGMENT_JS_URL" if present directly and used in the Segment's script
  // "src" tag or it constructed a URL with the following format:
  //
  // - https://${TELEMETRY_JS_HOST}/analytics.js/v1/${encodeURIComponent(TELEMETRY_API_KEY)}/analytics.min.js
  //
  // Therefore we are assuming that the URLs will have these formats too if
  // specified.
  //
  // The following example shows what we end up with if the variable is set,
  // after parsing it with regex:
  //
  // - https://example.redhat.com/cdn/analytics.js/v1/abcde/analytics.min.js
  // - https://example.redhat.com/cdn
  if (telemetry.SEGMENT_JS_URL) {
    const match = telemetry.SEGMENT_JS_URL.match(/^(.+?)\/analytics\.js\/v1(?:[/?#].*)?$/);
    if (match) {
      const normalizedCdnUrl = normalizeCdnUrl(match[1]);
      if (!normalizedCdnUrl) {
        return undefined;
      }

      return normalizedCdnUrl;
    }
    if (window.SERVER_FLAGS.telemetry?.DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.debug(
        'A legacy "SEGMENT_JS_URL" was provided, but no "/analytics.js/v1" was matched',
        telemetry.SEGMENT_JS_URL,
      );
    }

    return undefined;
  }

  // Ultimately, if the "SEGMENT_JS_HOST" is set, simply make sure that it has
  // the proper "https" protocol set, because the Segment library expects a
  // URL, not just a hostname.
  if (telemetry.SEGMENT_JS_HOST) {
    const normalizedCdnUrl = normalizeCdnUrl(telemetry.SEGMENT_JS_HOST);
    if (!normalizedCdnUrl) {
      return undefined;
    }

    return normalizedCdnUrl;
  }

  return undefined;
};
