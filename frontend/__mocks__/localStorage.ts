let _localStorage = {};

(window as any).localStorage = {
  setItem(key, value) {
    return Object.assign(_localStorage, {[key]: value});
  },
  getItem(key) {
    return _localStorage[key];
  },
  clear() {
    _localStorage = {};
  }
};
