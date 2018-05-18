import { coFetch } from '../co-fetch';
import { stripBasePath } from '../components/utils/link';
import { LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY } from '../const';

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

  logout: (next) => {
    setNext(next || window.SERVER_FLAGS.basePath);
    [userID, name, email, LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY].forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    });
    coFetch(window.SERVER_FLAGS.logoutURL, {
      method: 'POST',
    }).then(() => authSvc.login()).catch(e => {
      // eslint-disable-next-line no-console
      console.error('ERROR LOGGING OUT', e);
      authSvc.login();
    });
  },

  login: () => {
    window.location = window.SERVER_FLAGS.loginURL;
  },
};
