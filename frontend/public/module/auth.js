import * as _ from 'lodash-es';

import { coFetch } from '../co-fetch';
import { stripBasePath } from '../components/utils/link';

const loginState = (key) => localStorage.getItem(key);

const loginStateItem = (key) => loginState(key);

const userID = 'userID';
const name = 'name';
const email = 'email';

const setNext = (next) => {
  if (!next) {
    return;
  }

  try {
    // Don't redirect the user back to the error page after logging in.
    const path = stripBasePath(next);
    localStorage.setItem('next', path.startsWith('/error') ? '/' : path);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
};

const clearLocalStorage = () => {
  [userID, name, email].forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
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

  // Avoid logging out multiple times if concurrent requests return unauthorized.
  logout: _.once((next) => {
    setNext(next);
    clearLocalStorage();
    coFetch(window.SERVER_FLAGS.logoutURL, { method: 'POST' })
      // eslint-disable-next-line no-console
      .catch((e) => console.error('Error logging out', e))
      .then(() => {
        if (window.SERVER_FLAGS.logoutRedirect && !next) {
          window.location = window.SERVER_FLAGS.logoutRedirect;
        } else {
          authSvc.login();
        }
      });
  }),

  // Extra steps are needed if this is OpenShift to delete the user's access
  // token and logout the kube:admin user.
  logoutOpenShift: (isKubeAdmin = false) => {
    return authSvc.deleteOpenShiftToken().then(() => {
      if (isKubeAdmin) {
        authSvc.logoutKubeAdmin();
      } else {
        authSvc.logout();
      }
    });
  },

  deleteOpenShiftToken: () => {
    return (
      coFetch('/api/openshift/delete-token', { method: 'POST' })
        // eslint-disable-next-line no-console
        .catch((e) => console.error('Error deleting token', e))
    );
  },

  // The kube:admin user has a special logout flow. The OAuth server has a
  // session cookie that must be cleared by POSTing to the kube:admin logout
  // endpoint, otherwise the user will be logged in again immediately after
  // logging out.
  logoutKubeAdmin: () => {
    clearLocalStorage();
    // First POST to the console server to clear the console session cookie.
    coFetch(window.SERVER_FLAGS.logoutURL, { method: 'POST' })
      // eslint-disable-next-line no-console
      .catch((e) => console.error('Error logging out', e))
      .then(() => {
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
      });
  },

  login: () => {
    window.location = window.SERVER_FLAGS.loginURL;
  },
};
