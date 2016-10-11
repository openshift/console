// Ensure datalayer for GTM exists
const dataLayer = window.dataLayer = window.dataLayer || [];
let activeRoute;

export const analyticsSvc = {
  unsetRoute: () => activeRoute = null,
  push: (...args) => dataLayer.push(...args),

  error: (message, route) => {
    route = route || activeRoute || location.pathname;
    dataLayer.push({
      event: 'tectonicError',
      attributes: {
        message: message,
        route: route,
      }
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
