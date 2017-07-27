import _ from 'lodash';
import Cookies from 'js-cookie';

import {coFetchJSON} from '../co-fetch.js';

const loginState = () => {
  const state = Cookies.get('state');
  if (!state) {
    return null;
  }

  try {
    return JSON.parse(window.atob(state));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.stack);
    return null;
  }
};

const decodeUTF8 = utf8 => {
  if (!_.isString(utf8)) {
    return utf8;
  }
  // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa#Unicode_Strings
  try {
    return decodeURIComponent(escape(utf8));
  } catch (ignored) {
    return utf8;
  }
};

const loginStateItem = key => decodeUTF8(_.get(loginState(), key));


export const authSvc = {
  state: loginState,

  userID: () => loginStateItem('userID'),
  name: () => loginStateItem('name'),
  email: () => loginStateItem('email'),

  logout: (prev) => {
    let url = window.SERVER_FLAGS.loginURL;
    return coFetchJSON.post(window.SERVER_FLAGS.logoutURL)
      .then(() => {
        if (prev) {
          url += `?prev=${prev}`;
        }
        window.location.href = url;
      })
      .catch(() => {
        // Avoid redirect loops
        if (window.location.href.indexOf(window.SERVER_FLAGS.loginErrorURL) === -1) {
          window.location.href = `${window.SERVER_FLAGS.loginErrorURL}?error_type=auth&error=logout_error`;
        }
      });
  },

  // Infer user is logged-in by presence of valid state cookie.
  isLoggedIn: () => !!loginState(),
};
