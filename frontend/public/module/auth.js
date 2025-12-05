import * as _ from 'lodash-es';
import { consoleFetch as coFetch } from '@console/dynamic-plugin-sdk/src/utils/fetch';
import { stripBasePath } from '../components/utils/link';

const {
  kubeAdminLogoutURL,
  loginErrorURL,
  loginSuccessURL,
  loginURL,
  logoutRedirect,
  logoutURL,
} = window.SERVER_FLAGS;

export const LOGIN_ERROR_PATH = loginErrorURL
  ? new URL(loginErrorURL, window.location.href).pathname
  : '';

const isLoginErrorPath = (path) => path && path === LOGIN_ERROR_PATH;

const loginState = (key) => localStorage.getItem(key);

const loginStateItem = (key) => loginState(key);

const userID = 'userID';
const name = 'name';
const email = 'email';
const clearLocalStorageKeys = [userID, name, email];

// Constants for redirect loop detection
const AUTH_REDIRECT_COUNT_KEY = 'auth-redirect-count';
const MAX_AUTH_REDIRECTS = 3;

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

// Helper functions for redirect counter
const getAuthRedirectCount = () => {
  try {
    const count = sessionStorage.getItem(AUTH_REDIRECT_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to get auth redirect count from sessionStorage', e);
    return 0;
  }
};

const incrementAuthRedirectCount = () => {
  try {
    const count = getAuthRedirectCount() + 1;
    sessionStorage.setItem(AUTH_REDIRECT_COUNT_KEY, count.toString());
    return count;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to increment auth redirect count in sessionStorage', e);
    return 0;
  }
};

const resetAuthRedirectCount = () => {
  try {
    sessionStorage.removeItem(AUTH_REDIRECT_COUNT_KEY);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to reset auth redirect count in sessionStorage', e);
  }
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
    const redirect = next ? '' : logoutRedirect;
    if (redirect) {
      window.location.assign(redirect);
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

  logout: _.once((next, isKubeAdmin = false) => {
    setNext(next);
    clearLocalStorage(clearLocalStorageKeys);
    coFetch(logoutURL, { method: 'POST' })
      // eslint-disable-next-line no-console
      .catch((e) => console.error('Error logging out', e))
      .then(() => {
        if (isKubeAdmin) {
          authSvc.logoutKubeAdmin();
        } else {
          authSvc.logoutRedirect(next);
        }
      });
  }),

  // The kube:admin user has a special logout flow. The OAuth server has a
  // session cookie that must be cleared by POSTing to the kube:admin logout
  // endpoint, otherwise the user will be logged in again immediately after
  // logging out.
  logoutKubeAdmin: () => {
    // We need to POST to the kube:admin logout URL. Since this is a
    // cross-origin request, use a hidden form to POST.
    const form = document.createElement('form');
    form.action = kubeAdminLogoutURL;
    form.method = 'POST';

    // Redirect back to the console when logout is complete by passing a
    // `then` parameter.
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'then';
    input.value = loginSuccessURL;
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
  },

  login: () => {
    // Ensure that we don't redirect to the current URL in a loop
    // when using local bridge in development mode without authorization.
    if (![window.location.href, window.location.pathname].includes(loginURL)) {
      window.location = loginURL;
    }
  },

  // Handle 401 responses with redirect loop detection
  handle401: (next) => {
    const redirectCount = incrementAuthRedirectCount();

    // If we've exceeded the max redirects, redirect to the error page
    if (redirectCount > MAX_AUTH_REDIRECTS) {
      // eslint-disable-next-line no-console
      console.error(
        `Authentication redirect loop detected (${redirectCount} consecutive 401 responses). Redirecting to error page.`,
      );

      // Build error page URL with query parameters
      const errorURL = new URL(loginErrorURL || '/auth/error', window.location.origin);
      errorURL.searchParams.set('error', 'redirect_loop_detected');
      errorURL.searchParams.set('error_type', 'auth');

      // Avoid redirecting if we're already on the error page
      if (![window.location.href, window.location.pathname].includes(loginErrorURL)) {
        window.location.href = errorURL.toString();
      }
      resetAuthRedirectCount();
      return;
    }

    // Proceed with normal logout flow
    authSvc.logout(next);
  },

  // Reset redirect counter (called on successful k8s requests)
  resetRedirectCount: () => {
    resetAuthRedirectCount();
  },
};
