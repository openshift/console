import * as React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Route, Router, Switch } from 'react-router-dom';
import { linkify } from 'react-linkify';
// AbortController is not supported in some older browser versions
import 'abort-controller/polyfill';
import store from '../redux';
import { detectFeatures } from '../actions/features';
import { history, AsyncComponent } from './utils';
import * as UIActions from '../actions/ui';
import { fetchSwagger, getCachedResources } from '../module/k8s';
import { receivedResources, watchAPIServices } from '../actions/k8s';
// cloud shell imports must come later than features
import CloudShellTab from '@console/app/src/components/cloud-shell/CloudShellTab';
const consoleLoader = () =>
  import(
    '@console/kubevirt-plugin/src/components/connected-vm-console/vm-console-page' /* webpackChunkName: "kubevirt" */
  ).then((m) => m.VMConsolePage);
import { ConsoleApp } from './console-app';
import '../vendor.scss';
import '../style.scss';

// Edge lacks URLSearchParams
import 'url-search-params-polyfill';

// Disable linkify 'fuzzy links' across the app.
// Only linkify url strings beginning with a proper protocol scheme.
linkify.set({ fuzzyLink: false });

const startDiscovery = () => store.dispatch(watchAPIServices());

// Load cached API resources from localStorage to speed up page load.
getCachedResources()
  .then((resources) => {
    if (resources) {
      store.dispatch(receivedResources(resources));
    }
    // Still perform discovery to refresh the cache.
    startDiscovery();
  })
  .catch(startDiscovery);

store.dispatch(detectFeatures());

// Global timer to ensure all <Timestamp> components update in sync
setInterval(() => store.dispatch(UIActions.updateTimestamps(Date.now())), 10000);

// Fetch swagger on load if it's stale.
fetchSwagger();

// Used by GUI tests to check for unhandled exceptions
window.windowError = false;
window.onerror = window.onunhandledrejection = (e) => {
  // eslint-disable-next-line no-console
  console.error('Uncaught error', e);
  window.windowError = e || true;
};

if ('serviceWorker' in navigator) {
  if (window.SERVER_FLAGS.loadTestFactor > 1) {
    // eslint-disable-next-line import/no-unresolved
    import('file-loader?name=load-test.sw.js!../load-test.sw.js')
      .then(() => navigator.serviceWorker.register('/load-test.sw.js'))
      .then(
        () =>
          new Promise((r) =>
            navigator.serviceWorker.controller
              ? r()
              : navigator.serviceWorker.addEventListener('controllerchange', () => r()),
          ),
      )
      .then(() =>
        navigator.serviceWorker.controller.postMessage({
          topic: 'setFactor',
          value: window.SERVER_FLAGS.loadTestFactor,
        }),
      );
  } else {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => registrations.forEach((reg) => reg.unregister()))
      // eslint-disable-next-line no-console
      .catch((e) => console.warn('Error unregistering service workers', e));
  }
}

render(
  <Provider store={store}>
    <Router history={history} basename={window.SERVER_FLAGS.basePath}>
      <Switch>
        <Route
          path="/k8s/ns/:ns/virtualmachineinstances/:name/standaloneconsole"
          render={(componentProps) => <AsyncComponent loader={consoleLoader} {...componentProps} />}
        />
        <Route path="/terminal" component={CloudShellTab} />
        <Route path="/" component={ConsoleApp} />
      </Switch>
    </Router>
  </Provider>,
  document.getElementById('app'),
);
