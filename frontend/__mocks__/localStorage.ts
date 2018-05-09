let _localStorage = {};

(window as any).localStorage = (window as any).sessionStorage = {
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
