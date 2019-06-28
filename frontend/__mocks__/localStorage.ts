let _localStorage = {};

(window as any).localStorage = (window as any).sessionStorage = {
  setItem(key, value) {
    Object.assign(_localStorage, { [key]: value} );
  },
  getItem(key) {
    return _localStorage[key] || null;
  },
  clear() {
    _localStorage = {};
  },
};
