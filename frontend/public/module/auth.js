import * as _ from 'lodash-es';
import { coFetch } from '../co-fetch';
import { stripBasePath } from '../components/utils/link';

export const LOGIN_ERROR_PATH = window.SERVER_FLAGS.loginErrorURL
  ? new URL(window.SERVER_FLAGS.loginErrorURL, window.location.href).pathname
  : '';

const isLoginErrorPath = (path) => path && path === LOGIN_ERROR_PATH;

const loginState = (key) => localStorage.getItem(key);

const loginStateItem = (key) => loginState(key);

const userID = 'userID';
const name = 'name';
const email = 'email';
const clearLocalStorageKeys = [userID, name, email];
const lastClusterKey = 'bridge/last-cluster'; // TODO remove multicluster

const setNext = (next) => {
  if (!next) {
    return;
  }

  try {
    // Don't redirect the user back to the error page after logging in.
    localStorage.setItem('next', isLoginErrorPath(next) ? '/' : stripBasePath(next));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to next URL in localStorage', e);
  }
};

const clearLocalStorage = (keys) => {
  keys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to clear localStorage', e);
    }
  });
};

export const authSvc = {
  userID: () => {
    const id = loginStateItem(userID);
    try {
      return id && atob(id);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('error decoding userID', id, ':', e);
    }
    return id;
  },
  name: () => loginStateItem(name),
  email: () => loginStateItem(email),

  logoutRedirect: (next) => {
    const logoutRedirect = next ? '' : window.SERVER_FLAGS.logoutRedirect;
    if (logoutRedirect) {
      window.location.assign(logoutRedirect);
      return;
    }

    // If we're on the login error page, this means there was a problem with the last
    // authentication attempt. Show the error from the previous attempt instead of redirecting
    // login again. This is necessary because login may not be available (e.g. if the OAuth
    // provider is not configured for browser authentication) and we don't want to get stuck in
    // a loop.
    if (!isLoginErrorPath(window.location.pathname)) {
      authSvc.login();
    }
  },

  // Avoid logging out multiple times if concurrent requests return unauthorized.
  // TODO remove multicluster
  logout: _.once((next, cluster) => {
    setNext(next);
    clearLocalStorage(clearLocalStorageKeys);
    coFetch(
      cluster ? `${window.SERVER_FLAGS.logoutURL}/${cluster}` : window.SERVER_FLAGS.logoutURL, // TODO remove multicluster
      { method: 'POST' },
    )
      // eslint-disable-next-line no-console
      .catch((e) => console.error('Error logging out', e))
      .then(() => authSvc.logoutRedirect(next));
  }),

  // Extra steps are needed if this is OpenShift to delete the user's access
  // token and logout the kube:admin user.
  logoutOpenShift: (isKubeAdmin = false) => {
    clearLocalStorage(clearLocalStorageKeys);
    coFetch('/api/openshift/delete-token', { method: 'POST' })
      // eslint-disable-next-line no-console
      .catch((e) => console.error('Error deleting token', e))
      .then(() => {
        if (isKubeAdmin) {
          authSvc.logoutKubeAdmin();
        } else {
          authSvc.logoutRedirect();
        }
      });
  },

  // The kube:admin user has a special logout flow. The OAuth server has a
  // session cookie that must be cleared by POSTing to the kube:admin logout
  // endpoint, otherwise the user will be logged in again immediately after
  // logging out.
  logoutKubeAdmin: () => {
    // We need to POST to the kube:admin logout URL. Since this is a
    // cross-origin request, use a hidden form to POST.
    const form = document.createElement('form');
    form.action = window.SERVER_FLAGS.kubeAdminLogoutURL;
    form.method = 'POST';

    // Redirect back to the console when logout is complete by passing a
    // `then` parameter.
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'then';
    input.value = window.SERVER_FLAGS.loginSuccessURL;
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
  },

  // TODO remove multicluster
  logoutMulticluster: () => {
    clearLocalStorage([...clearLocalStorageKeys, lastClusterKey]);
    window.location = window.SERVER_FLAGS.multiclusterLogoutRedirect;
  },

  // TODO remove multicluster
  login: (cluster) => {
    // Ensure that we don't redirect to the current URL in a loop
    // when using local bridge in development mode without authorization.
    const loginURL = cluster // TODO remove multicluster
      ? `${window.SERVER_FLAGS.loginURL}/${cluster}`
      : window.SERVER_FLAGS.loginURL;
    if (![window.location.href, window.location.pathname].includes(loginURL)) {
      window.location = loginURL;
    }
  },
};
