import React from 'react';
import Helmet from 'react-helmet';
import { browserHistory, IndexRoute, Route, Router } from 'react-router';

import { ClusterOverviewContainer } from './cluster-overview-container';
import { ErrorPage, ErrorPage404 } from './error';
import { NamespacesPage } from './namespace';
import { NodeDetailsPage, NodesPage, NodePodsPage } from './node';
import { register } from './react-wrapper';

const App = (props) => <div>
  <Helmet titleTemplate="%s · Tectonic" />
  {props.children}
</div>;

// TODO (andy): Once Angular router is removed, use ReactDOM's render() method to render Router to container div
const AppRouter = () => <Router history={browserHistory}>
  <Route path="/" component={App}>
    <IndexRoute component={ClusterOverviewContainer}/>

    <Route path="namespaces" component={NamespacesPage} />

    <Route path="nodes">
      <IndexRoute component={NodesPage} />
      <Route path=":name/details" component={NodeDetailsPage} />
      <Route path=":name/yaml" component={NodeDetailsPage} />
      <Route path=":name/pods" component={NodePodsPage} />
    </Route>

    <Route path="error" component={ErrorPage} />
    <Route path="*" component={ErrorPage404} />
  </Route>
</Router>;
register('AppRouter', AppRouter);
