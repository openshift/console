const SEGMENT_KEY = '';

const initSegment = () => {
  const analytics = ((window as any).analytics = (window as any).analytics || []);
  if (!analytics.initialize)
    if (analytics.invoked)
      window.console && console.error && console.error('Segment snippet included twice.');
    else {
      analytics.invoked = !0;
      analytics.methods = [
        'trackSubmit',
        'trackClick',
        'trackLink',
        'trackForm',
        'pageview',
        'identify',
        'reset',
        'group',
        'track',
        'ready',
        'alias',
        'debug',
        'page',
        'once',
        'off',
        'on',
        'addSourceMiddleware',
        'addIntegrationMiddleware',
        'setAnonymousId',
        'addDestinationMiddleware',
      ];
      analytics.factory = function(e: string) {
        return function() {
          var t = Array.prototype.slice.call(arguments);
          t.unshift(e);
          analytics.push(t);
          return analytics;
        };
      };
      for (var e = 0; e < analytics.methods.length; e++) {
        var key = analytics.methods[e];
        analytics[key] = analytics.factory(key);
      }
      analytics.load = function(key: string, e: Event) {
        const t = document.createElement('script');
        t.type = 'text/javascript';
        t.async = !0;
        t.src = 'https://cdn.segment.com/analytics.js/v1/' + key + '/analytics.min.js';
        const n = document.getElementsByTagName('script')[0];
        if (n.parentNode) {
          n.parentNode.insertBefore(t, n);
        }
        analytics._loadOptions = e;
      };
      analytics._writeKey = SEGMENT_KEY;
      analytics.SNIPPET_VERSION = '4.13.2';
      analytics.load(SEGMENT_KEY);
    }
  return analytics;
};

export const eventListener = (eventType: string, properties: any) => {
  // eslint-disable-next-line no-console
  console.log('Demo Plugin received telemetry event: ', eventType, properties);
  const analytics = initSegment();
  switch (eventType) {
    case 'identify':
      const { clusterId, id, ...otherProperties } = properties;
      // TODO hash anonymousId
      const anonymousId = `${clusterId}-${id}`;
      analytics.identify(anonymousId, otherProperties);
      break;
    case 'page':
      analytics.page(undefined, properties);
      break;
    default:
      analytics.track(eventType, properties);
  }
};
