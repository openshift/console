import * as _ from 'lodash';
import { authSvc } from '@console/internal/module/auth';
import { RetryError, HttpError } from '../error/http-error';
import { InternalReduxStore } from '../redux';

const cookiePrefix = 'csrf-token=';
export const getCSRFToken = () =>
  document &&
  document.cookie &&
  document.cookie
    .split(';')
    .map((c) => _.trim(c))
    .filter((c) => c.startsWith(cookiePrefix))
    .map((c) => c.slice(cookiePrefix.length))
    .pop();

// TODO: url can be url or path, but shouldLogout only handles paths
export const shouldLogout = (url: string): boolean => {
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

export const validateStatus = async (
  response: Response,
  url: string,
  method: string,
  retry: boolean,
) => {
  if (response.ok) {
    return response;
  }

  if (retry && response.status === 429) {
    throw new RetryError();
  }

  if (response.status === 401 && shouldLogout(url)) {
    authSvc.logout(window.location.pathname);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || contentType.indexOf('json') === -1) {
    throw new HttpError(response.statusText, response.status, response);
  }

  if (response.status === 403) {
    return response.json().then((json) => {
      throw new HttpError(
        json.message || 'Access denied due to cluster policy.',
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

    throw new HttpError(reason, response.status, response, json);
  });
};

type ImpersonateHeaders = {
  'Impersonate-User': string;
};
export const getImpersonateHeaders = (): ImpersonateHeaders => {
  if (!InternalReduxStore) return undefined;
  const { kind, name } = InternalReduxStore.getState().UI.get('impersonate', {});
  if ((kind === 'User' || kind === 'Group') && name) {
    // Even if we are impersonating a group, we still need to set Impersonate-User to something or k8s will complain
    const headers = {
      'Impersonate-User': name,
    };
    if (kind === 'Group') {
      headers['Impersonate-Group'] = name;
    }
    return headers;
  }
  return undefined;
};
