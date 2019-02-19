import * as React from 'react';
import { Route, Switch } from 'react-router';
import HomePage from './pages/Home';
import ImportPage from './pages/Import';
import TopologyPage from './pages/Topology';
import CodebasesPage from './pages/Codebases';


const DevConsoleRoutes: React.SFC = () => (
  <Switch>
    <Route path='/devconsole/import' component={ImportPage} />
    <Route path='/devconsole/codebases' component={CodebasesPage} />
    <Route path='/devconsole/topology' component={TopologyPage} />
    <Route path='/devconsole' component={HomePage} />
  </Switch>
);

export default DevConsoleRoutes;
