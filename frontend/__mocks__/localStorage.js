let localStorage = {};

window.localStorage = {
  setItem(key, value) {
    return Object.assign(localStorage, {[key]: value});
  },
  getItem(key) {
    return localStorage[key];
  },
  clear() {
    localStorage = {};
  }
};
