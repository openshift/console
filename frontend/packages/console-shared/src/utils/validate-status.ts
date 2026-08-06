import { HttpError, RetryError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';

// TODO: url can be url or path, but isK8sUrl only handles paths
export const isK8sUrl = (url: string): boolean => {
  const k8sRegex = new RegExp(`^${window.SERVER_FLAGS.basePath}api/kubernetes/`);
  // 401 from k8s. show logout screen
  if (k8sRegex.test(url)) {
    // Don't let 401s from proxied services log out users
    const proxyRegex = new RegExp(`^${window.SERVER_FLAGS.basePath}api/kubernetes/api/v1/proxy/`);
    if (proxyRegex.test(url)) {
      return false;
    }
    const serviceRegex = new RegExp(
      `^${window.SERVER_FLAGS.basePath}api/kubernetes/api/v1/namespaces/\\w+/services/\\w+/proxy/`,
    );
    if (serviceRegex.test(url)) {
      return false;
    }
    return true;
  }
  return false;
};

/**
 * Converts Go-style Unicode escape sequences (\uXXXX, \UXXXXXXXX) in K8s API error
 * messages back to actual Unicode characters for proper display in the browser.
 */
export const unescapeGoUnicode = (str: string): string =>
  str
    .replace(/\\U([0-9a-fA-F]{8})/g, (match, hex) => {
      const codePoint = parseInt(hex, 16);
      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match;
    })
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));

type AuthHandler = {
  resetRedirectCount: () => void;
  handle401: (next: string) => void;
};

let authHandlerProvider: () => Promise<AuthHandler>;

export const setAuthHandlerProvider = (provider: () => Promise<AuthHandler>) => {
  authHandlerProvider = provider;
};

const getAuthHandler = (): Promise<AuthHandler> | undefined => authHandlerProvider?.();

export const validateStatus = async (
  response: Response,
  url: string,
  method: string,
  retry: boolean,
) => {
  const isK8sRequest = isK8sUrl(url);
  if (response.ok || response.status === 304) {
    if (isK8sRequest) {
      getAuthHandler()
        ?.then((authSvc) => {
          authSvc.resetRedirectCount();
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error('Error resetting redirect counter', e);
        });
    }
    return response;
  }

  if (retry && response.status === 429) {
    throw new RetryError();
  }

  if (response.status === 401 && isK8sRequest) {
    const next = window.location.pathname + window.location.search + window.location.hash;

    getAuthHandler()
      ?.then((authSvc) => {
        authSvc.handle401(next);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error('Error during logout after 401 response', e);
      });
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || contentType.indexOf('json') === -1) {
    throw new HttpError(response.statusText, response.status, response);
  }

  if (response.status === 403) {
    return response.json().then((json) => {
      throw new HttpError(
        unescapeGoUnicode(json.message || 'Access denied due to cluster policy.'),
        response.status,
        response,
        json,
      );
    });
  }

  return response.json().then((json) => {
    // retry 409 conflict errors due to ClustResourceQuota / ResourceQuota
    // https://bugzilla.redhat.com/show_bug.cgi?id=1920699
    if (
      retry &&
      method === 'POST' &&
      response.status === 409 &&
      ['resourcequotas', 'clusterresourcequotas'].includes(json.details?.kind)
    ) {
      throw new RetryError();
    }
    const cause = json.details?.causes?.[0];
    let reason;
    if (cause) {
      reason = `Error "${cause.message}" for field "${cause.field}".`;
    }
    if (!reason) {
      reason = json.message;
    }
    if (!reason) {
      reason = json.error;
    }
    if (!reason) {
      reason = response.statusText;
    }

    throw new HttpError(unescapeGoUnicode(reason), response.status, response, json);
  });
};
