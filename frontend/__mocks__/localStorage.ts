let _localStorage = {};

(window as any).localStorage = (window as any).sessionStorage = {
  setItem(key: string, value: string) {
    Object.assign(_localStorage, { [key]: value} );
  },
  getItem(key: string): string | null {
    return _localStorage.hasOwnProperty(key) ? _localStorage[key] : null;
  },
  clear() {
    _localStorage = {};
  },
};
