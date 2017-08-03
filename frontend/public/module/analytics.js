// Ensure datalayer for GTM exists
const dataLayer = window.dataLayer = window.dataLayer || [];
let activeRoute;

export const analyticsSvc = {
  unsetRoute: () => activeRoute = null,
  push: (...args) => dataLayer.push(...args),

  error: (message, route, stack='') => {
    route = route || activeRoute || location.pathname;
    dataLayer.push({
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
    dataLayer.push({
      event: 'tectonicRouteChange',
      attributes: {
        route: route,
      }
    });
  },
};
