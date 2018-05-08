// Ensure datalayer for GTM exists
const dataLayer = window.dataLayer = window.dataLayer || [];
let activeRoute;

export const analyticsSvc = {
  unsetRoute: () => activeRoute = null,
  push: (...args) => {
    if (!window.SERVER_FLAGS.googleTagManagerID) {
      return;
    }
    dataLayer.push(...args);
  },

  error: (message, route, stack='') => {
    route = route || activeRoute || location.pathname;
    analyticsSvc.push({
      event: 'tectonicError',
      attributes: {
        consoleVersion: window.SERVER_FLAGS.consoleVersion,
        message,
        route,
        stack: stack.toString(),
      },
    });
  },

  route: (route) => {
    activeRoute = route;
    analyticsSvc.push({
      event: 'tectonicRouteChange',
      attributes: {
        route: route,
      }
    });
  },
};
