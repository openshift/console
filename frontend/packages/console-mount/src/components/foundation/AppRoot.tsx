import * as React from 'react';
import { Spinner } from '@patternfly/react-core';
import { createBrowserHistory } from 'history';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { useReduxStore } from '../../redux';
import { IncludePlugins } from '../plugins';
import MainAppContent from './MainAppContent';
import TopLevelRoutes from './TopLevelRoutes';
import useWindowErrorCatch from './useWindowErrorCatch';

const history = createBrowserHistory();

const AppRoot: React.FC = () => {
  const store = useReduxStore();
  useWindowErrorCatch();

  return (
    <React.Suspense fallback={<Spinner />}>
      <Provider store={store}>
        <IncludePlugins />
        <Router history={history}>
          <TopLevelRoutes mainAppComponent={MainAppContent} />
        </Router>
      </Provider>
    </React.Suspense>
  );
};

export default AppRoot;
