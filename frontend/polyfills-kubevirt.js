/* eslint-disable */

global.MutationObserver = global.MutationObserver || class {
  constructor(callback) {}
  disconnect() {}
  observe(element, initObject) {}
};

