const SEGMENT_KEY = '';

const initSegment = () => {
  const analytics = ((window as any).analytics = (window as any).analytics || []);
  if (analytics.initialize) {
    return;
  }
  if (analytics.invoked)
    window.console && console.error && console.error('Segment snippet included twice.');
  else {
    analytics.invoked = true;
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
        let t = Array.prototype.slice.call(arguments);
        t.unshift(e);
        analytics.push(t);
        return analytics;
      };
    };
    for (let e = 0; e < analytics.methods.length; e++) {
      let key = analytics.methods[e];
      analytics[key] = analytics.factory(key);
    }
    analytics.load = function(key: string, e: Event) {
      const t = document.createElement('script');
      t.type = 'text/javascript';
      t.async = true;
      t.src = 'https://cdn.segment.com/analytics.js/v1/' + encodeURIComponent(key) + '/analytics.min.js';
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
};

initSegment();

export const eventListener = async (eventType: string, properties?: any) => {
  // eslint-disable-next-line no-console
  console.log('Demo Plugin received telemetry event: ', eventType, properties);
  const anonymousIP = {
    context: {
      ip: '0.0.0.0',
    },
  };
  switch (eventType) {
    case 'identify':
      const { user, ...otherProperties } = properties;
      const id = user.metadata.uid || `${location.host}-${user.metadata.name}`;
      // Use SHA1 hash algorithm to anonymize the user
      const anonymousIdBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(id));
      const anonymousIdArray = Array.from(new Uint8Array(anonymousIdBuffer));
      const anonymousId = anonymousIdArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      (window as any).analytics.identify(anonymousId, otherProperties, anonymousIP);
      break;
    case 'page':
      (window as any).analytics.page(undefined, properties, anonymousIP);
      break;
    default:
      (window as any).analytics.track(eventType, properties, anonymousIP);
  }
};
