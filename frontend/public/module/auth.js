const loginState = key => localStorage.getItem(key);

const loginStateItem = key => loginState(key);

const bearerToken = 'bearerToken';
const userID = 'userID';
const name = 'name';
const email = 'email';

export const authSvc = {
  getToken: () => localStorage.getItem(bearerToken),
  userID: () => loginStateItem(userID) && atob(loginStateItem(userID)),
  name: () => loginStateItem(name),
  email: () => loginStateItem(email),

  logout: () => {
    [userID, name, email, bearerToken].forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    });
    authSvc.login();
  },

  login: () => {
    try {
      localStorage.setItem('next', window.location.pathname);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
    window.location = window.SERVER_FLAGS.loginURL;
  },

  // Infer user is logged-in by presence of valid state cookie.
  isLoggedIn: () => {
    const token = authSvc.getToken();
    if (!token) {
      return false;
    }
    const split = token.split('.');
    if (split.length !== 3) {
      return false;
    }
    const middle = split[1];

    try {
      JSON.parse(atob(middle));
    } catch (ignored) {
      return false;
    }
    return true;
  }
};
