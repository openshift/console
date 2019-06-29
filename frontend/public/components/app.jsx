import * as _ from 'lodash-es';
import * as React from 'react';
import { render } from 'react-dom';
import { Helmet } from 'react-helmet';
import { Provider } from 'react-redux';
import { Route, Router } from 'react-router-dom';
// AbortController is not supported in some older browser versions
import 'abort-controller/polyfill';

import store from '../redux';
import { detectFeatures } from '../actions/features';
import { analyticsSvc } from '../module/analytics';
import AppContents from './app-contents';
import { getBrandingDetails, Masthead } from './masthead';
import { ConsoleNotifier } from './console-notifier';
import { Navigation } from './nav';
import { history } from './utils';
import * as UIActions from '../actions/ui';
import { fetchSwagger, getCachedResources } from '../module/k8s';
import { ActionType, watchAPIServices } from '../actions/k8s';
import '../vendor.scss';
import '../style.scss';

//PF4 Imports
import { Page } from '@patternfly/react-core';

const breakpointMD = 768;

// Edge lacks URLSearchParams
import 'url-search-params-polyfill';

class App extends React.PureComponent {
  constructor(props) {
    super(props);

    this._onNavToggle = this._onNavToggle.bind(this);
    this._onNavSelect = this._onNavSelect.bind(this);
    this._isDesktop = this._isDesktop.bind(this);
    this._onResize = this._onResize.bind(this);
    this.previousDesktopState = this._isDesktop();

    this.state = {
      isNavOpen: this._isDesktop(),
    };
  }

  componentWillMount() {
    window.addEventListener('resize', this._onResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._onResize);
  }

  componentDidUpdate(prevProps) {
    const props = this.props;
    // Prevent infinite loop in case React Router decides to destroy & recreate the component (changing key)
    const oldLocation = _.omit(prevProps.location, ['key']);
    const newLocation = _.omit(props.location, ['key']);
    if (_.isEqual(newLocation, oldLocation) && _.isEqual(props.match, prevProps.match)) {
      return;
    }
    // two way data binding :-/
    const { pathname } = props.location;
    store.dispatch(UIActions.setCurrentLocation(pathname));
    analyticsSvc.route(pathname);
  }

  _isDesktop() {
    return window.innerWidth >= breakpointMD;
  }

  _onNavToggle() {

    // Some components, like svg charts, need to reflow when nav is toggled.
    // Fire event after a short delay to allow nav animation to complete.
    setTimeout(() => {
      window.dispatchEvent(new Event('nav_toggle'));
    }, 100);

    this.setState(prevState => {
      return {
        isNavOpen: !prevState.isNavOpen,
      };
    });
  }

  _onNavSelect() {
    //close nav on mobile nav selects
    if (!this._isDesktop()) {
      this.setState({isNavOpen: false});
    }
  }

  _onResize() {
    const isDesktop = this._isDesktop();
    if (this.previousDesktopState !== isDesktop) {
      this.setState({isNavOpen: isDesktop});
      this.previousDesktopState = isDesktop;
    }
  }

  render() {
    const { isNavOpen } = this.state;
    const { productName } = getBrandingDetails();

    return (
      <React.Fragment>
        <Helmet
          titleTemplate={`%s · ${productName}`}
          defaultTitle={productName}
        />
        <ConsoleNotifier location="BannerTop" />
        <Page
          header={<Masthead onNavToggle={this._onNavToggle} />}
          sidebar={<Navigation isNavOpen={isNavOpen} onNavSelect={this._onNavSelect} />}
        >
          <AppContents />
        </Page>
        <ConsoleNotifier location="BannerBottom" />
      </React.Fragment>
    );
  }
}

const startDiscovery = () => store.dispatch(watchAPIServices());

// Load cached API resources from localStorage to speed up page load.
getCachedResources().then(resources => {
  if (resources) {
    store.dispatch({type: ActionType.ReceivedResources, resources});
  }
  // Still perform discovery to refresh the cache.
  startDiscovery();
}).catch(startDiscovery);

store.dispatch(detectFeatures());

// Global timer to ensure all <Timestamp> components update in sync
setInterval(() => store.dispatch(UIActions.updateTimestamps(Date.now())), 10000);

// Fetch swagger on load if it's stale.
fetchSwagger();

// Used by GUI tests to check for unhandled exceptions
window.windowError = false;

window.onerror = function(message, source, lineno, colno, optError={}) {
  try {
    const e = `${message} ${source} ${lineno} ${colno}`;
    analyticsSvc.error(e, null, optError.stack);
  } catch (err) {
    try {
      // eslint-disable-next-line no-console
      console.error(err);
    } catch (ignored) {
      // ignore
    }
  }
  window.windowError = true;
};

window.onunhandledrejection = function(e) {
  try {
    analyticsSvc.error(e, null);
  } catch (err) {
    try {
      // eslint-disable-next-line no-console
      console.error(err);
    } catch (ignored) {
      // ignore
    }
  }
  window.windowError = true;
};

if ('serviceWorker' in navigator) {
  if (window.SERVER_FLAGS.loadTestFactor > 1) {
    // eslint-disable-next-line import/no-unresolved
    import('file-loader?name=load-test.sw.js!../load-test.sw.js')
      .then(() => navigator.serviceWorker.register('/load-test.sw.js'))
      .then(() => new Promise(r => navigator.serviceWorker.controller ? r() : navigator.serviceWorker.addEventListener('controllerchange', () => r())))
      .then(() => navigator.serviceWorker.controller.postMessage({topic: 'setFactor', value: window.SERVER_FLAGS.loadTestFactor}));
  } else {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => registrations.forEach(reg => reg.unregister()))
      // eslint-disable-next-line no-console
      .catch(e => console.warn('Error unregistering service workers', e));
  }
}

render((
  <Provider store={store}>
    <Router history={history} basename={window.SERVER_FLAGS.basePath}>
      <Route path="/" component={App} />
    </Router>
  </Provider>
), document.getElementById('app'));
