import type { Page } from '@playwright/test';

export interface CSPViolationReport {
  'csp-report': Pick<
    SecurityPolicyViolationEvent,
    | 'documentURI'
    | 'violatedDirective'
    | 'effectiveDirective'
    | 'blockedURI'
    | 'sourceFile'
    | 'lineNumber'
    | 'disposition'
  > & {
    [key: string]: unknown;
  };
}

// Shape of the POST body the browser sends to a `report-uri` endpoint. It uses
// kebab-case keys (per the legacy CSP violation report spec), not the camelCase
// names on SecurityPolicyViolationEvent used by CSPViolationReport above.
interface RawCSPReportBody {
  'document-uri'?: string;
  'violated-directive'?: string;
  'effective-directive'?: string;
  'blocked-uri'?: string;
  'source-file'?: string;
  'line-number'?: number;
  disposition?: SecurityPolicyViolationEvent['disposition'];
}

// Fake reporting endpoint. Requests to it never hit the network: they're
// intercepted and fulfilled locally via CDP below.
const CSP_REPORT_URL = 'https://csp-violation-report.test/report';

// Normalize the browser's kebab-case report body into the camelCase shape
// callers expect. The body can also be missing entirely: CDP omits
// `request.postData` when the body isn't available inline (too large, or not
// text), so an unparseable body must produce a clearly-labelled report rather
// than one whose every field is `undefined`.
const parseCSPReport = (postData: string | undefined, fallbackURI: string): CSPViolationReport => {
  let raw: RawCSPReportBody | undefined;
  try {
    raw = JSON.parse(postData)?.['csp-report'];
  } catch {
    raw = undefined;
  }

  if (!raw || typeof raw !== 'object') {
    return {
      'csp-report': {
        documentURI: fallbackURI,
        violatedDirective: 'unknown',
        effectiveDirective: 'unknown',
        blockedURI: 'unknown',
        sourceFile: undefined,
        lineNumber: undefined,
        disposition: undefined,
        parseError: `Failed to parse CSP report body: ${postData ?? '<missing>'}`,
      },
    };
  }

  return {
    'csp-report': {
      documentURI: raw['document-uri'],
      violatedDirective: raw['violated-directive'],
      effectiveDirective: raw['effective-directive'],
      blockedURI: raw['blocked-uri'],
      sourceFile: raw['source-file'],
      lineNumber: raw['line-number'],
      disposition: raw.disposition,
    },
  };
};

// Import from Git e2e tests make direct browser requests to api.github.com
// which violates connect-src CSP. This is expected since git hosting can be
// on any arbitrary hostname (e.g. Gitea) and cannot be allowlisted in CSP.
const isExpectedGitConnectViolation = (report: CSPViolationReport['csp-report']) =>
  report.effectiveDirective === 'connect-src' &&
  report.blockedURI?.startsWith('https://api.github.com/');

// Resuming an intercepted request routinely fails with a "target closed" error
// when the request is still paused as the page is torn down at the end of a
// test; that is expected and must not be reported. Any other failure means the
// request stays paused forever, which surfaces as an unexplained navigation
// timeout, so make that visible instead of swallowing it.
const ignoreClosedTarget = (send: Promise<unknown>) =>
  send.catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    if (!/closed|detached/i.test(message)) {
      console.warn(`[CSP] Failed to resume intercepted request: ${message}`);
    }
  });

// Console only emits a CSP `report-uri` directive when the request serving the
// page carries a `Test-CSP-Reporting-Endpoint` header (see
// pkg/utils/utils.go BuildCSPDirectives / pkg/server/server.go indexHandler).
//
// Use `page` to test for Content Security Policy (CSP) violations, ported
// from the CDP-based approach in the former test-puppeteer-csp.ts, now
// applied to every navigation in every test rather than a single hardcoded
// page.
//
// `baseURL` scopes the header to Console's own origin. Only Console's backend
// understands it, and document navigations regularly leave that origin (the
// OAuth login flow redirects to the cluster's OAuth server), so without the
// scope this internal test-only header would be sent to third parties.
export const trackCSPViolations = async (
  page: Page,
  violations: CSPViolationReport[],
  baseURL?: string,
) => {
  // Create a Chrome DevTools Protocol (CDP) session for the page.
  const cdpSession = await page.context().newCDPSession(page);

  const consoleOrigin = baseURL ? new URL(baseURL).origin : undefined;
  const isConsoleURL = (url: string) => {
    if (!consoleOrigin) {
      return true;
    }
    try {
      return new URL(url).origin === consoleOrigin;
    } catch {
      return false;
    }
  };

  // Subscribe before enabling the domain: a 'Fetch.requestPaused' event that
  // arrives with no listener attached leaves that request paused forever.
  cdpSession.on('Fetch.requestPaused', ({ resourceType, request, requestId }) => {
    // When requesting the web page, add custom 'Test-CSP-Reporting-Endpoint' HTTP header
    // in order to instruct Console Bridge server to use the given CSP reporting endpoint.
    if (resourceType === 'Document' && isConsoleURL(request.url)) {
      const headers = Object.entries(request.headers).map(([name, value]) => ({ name, value }));

      headers.push({ name: 'Test-CSP-Reporting-Endpoint', value: CSP_REPORT_URL });
      ignoreClosedTarget(cdpSession.send('Fetch.continueRequest', { requestId, headers }));
    }

    // The browser will attempt to send any CSP violations to the CSP reporting endpoint.
    // When such request occurs, we manually fulfill that request before it is sent over
    // the network and therefore avoiding the need to implement that reporting endpoint.
    else if (resourceType === 'CSPViolationReport' && request.url === CSP_REPORT_URL) {
      const report = parseCSPReport(request.postData, request.url);
      if (!isExpectedGitConnectViolation(report['csp-report'])) {
        violations.push(report);
      }
      ignoreClosedTarget(cdpSession.send('Fetch.fulfillRequest', { requestId, responseCode: 200 }));
    }

    // Resume other requests that were not explicitly handled above.
    else {
      ignoreClosedTarget(cdpSession.send('Fetch.continueRequest', { requestId }));
    }
  });

  // This will trigger 'Fetch.requestPaused' events for the matching requests.
  await cdpSession.send('Fetch.enable', {
    patterns: [{ resourceType: 'Document' }, { resourceType: 'CSPViolationReport' }],
  });
};

export const assertNoCSPViolations = (violations: CSPViolationReport[]) => {
  if (violations.length === 0) {
    return;
  }
  const details = violations
    .map((v) => {
      const report = v['csp-report'];
      return (
        `  - ${report.violatedDirective} blocked ${report.blockedURI} on ${report.documentURI}` +
        (report.sourceFile ? ` (${report.sourceFile}:${report.lineNumber})` : '')
      );
    })
    .join('\n');
  throw new Error(`Content Security Policy violation(s) detected:\n${details}`);
};
