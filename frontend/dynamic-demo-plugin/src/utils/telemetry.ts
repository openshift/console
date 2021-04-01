import { createHash } from "crypto";

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
      analytics.SNIPPET_VERSION = '4.13.1';
      if (SEGMENT_KEY) {
        analytics.load(SEGMENT_KEY);
      }
    }
  return analytics;
};

initSegment();

export const eventListener = (eventType: string, properties?: any) => {
  // eslint-disable-next-line no-console
  console.log('Demo Plugin received telemetry event: ', eventType, properties);
  const analytics = initSegment();
  switch (eventType) {
    case 'identify':
      const { clusterId, id, user } = properties;
      // Use md5 hash to anonymize the user
      const anonymousId = createHash('md5').update(`${clusterId}-${id}`).digest('hex');
      (window as any).analytics.identify(anonymousId, user);
      break;
    case 'page':
      analytics.page(undefined, properties);
      break;
    default:
      analytics.track(eventType, properties);
  }
};
