import { coFetch } from '../co-fetch';
import { stripBasePath } from '../components/utils/link';

const loginState = key => localStorage.getItem(key);

const loginStateItem = key => loginState(key);

const userID = 'userID';
const name = 'name';
const email = 'email';

const setNext = next => {
  if (!next) {
    return;
  }
  try {
    localStorage.setItem('next', stripBasePath(next));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
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

  deleteOpenShiftToken: () => {
    return coFetch('/api/openshift/delete-token', { method: 'POST' })
      // eslint-disable-next-line no-console
      .catch(e => console.error('Error deleting token', e));
  },

  logout: (next) => {
    setNext(next);
    [userID, name, email].forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    });

    coFetch(window.SERVER_FLAGS.logoutURL, { method: 'POST', })
      // eslint-disable-next-line no-console
      .catch(e => console.error('Error logging out', e))
      .then(() => {
        if (window.SERVER_FLAGS.logoutRedirect && !next) {
          window.location = window.SERVER_FLAGS.logoutRedirect;
        } else {
          authSvc.login();
        }
      });
  },

  login: () => {
    window.location = window.SERVER_FLAGS.loginURL;
  },
};
