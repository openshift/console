/* eslint-env node */

// https://github.com/airbnb/enzyme/blob/master/docs/guides/jsdom.md

import { JSDOM } from 'jsdom';

const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

function copyProps(src, target) {
  Object.defineProperties(target, {
    ...Object.getOwnPropertyDescriptors(src),
    ...Object.getOwnPropertyDescriptors(target),
  });
}

global.window = window;
global.document = window.document;
// don't set global.navigator since vendor libs interpret its presence as browser env.
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

copyProps(window, global);
