import * as React from 'react';
import { Route, Switch } from 'react-router';
import App from './app';
import ImportPage from './pages/Import/Import';
import TopologyPage from './pages/Topology/Topology';
import CodebasesPage from './pages/Codebases/Codebases';


const DevConsoleRoutes: React.SFC = () => (
  <Switch>
    <Route path='/devconsole/import' component={ImportPage} />
    <Route path='/devconsole/codebases' component={CodebasesPage} />
    <Route path='/devconsole/topology' component={TopologyPage} />
    <Route path='/devconsole' component={App} />
  </Switch>
);

export default DevConsoleRoutes;
