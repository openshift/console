// https://github.com/facebook/jest/issues/4545
window.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0);
};
