import * as React from 'react';
import { Route, Switch } from 'react-router';
import App from './app';
import ImportApp from './pages/ImportApp';
import TopologyView from './pages/TopologyView';
import Codebases from './pages/Codebases';


const DevConsoleRoutes: React.SFC = () => (
  <Switch>
    <Route path='/devconsole/import' component={ImportApp} />
    <Route path='/devconsole/codebases' component={Codebases} />
    <Route path='/devconsole/topology' component={TopologyView} />
    <Route path='/devconsole' component={App} />
  </Switch>
);

export default DevConsoleRoutes;
