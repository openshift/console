import * as React from 'react';
import { Spinner } from '@patternfly/react-core';
import { createBrowserHistory } from 'history';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { useReduxStore } from '../../redux';
import { DetectPerspective } from '../perspectives';
import { IncludePlugins } from '../plugins';
import AppRoutes from './AppRoutes';
import PageFrame from './PageFrame';
import TopLevelRoutes from './TopLevelRoutes';

const history = createBrowserHistory();

const AppRoot: React.FC = () => {
  const store = useReduxStore();

  return (
    <React.Suspense fallback={<Spinner />}>
      <Provider store={store}>
        <IncludePlugins />
        <Router history={history}>
          <TopLevelRoutes>
            {() => (
              <DetectPerspective>
                <PageFrame>
                  <AppRoutes />
                </PageFrame>
              </DetectPerspective>
            )}
          </TopLevelRoutes>
        </Router>
      </Provider>
    </React.Suspense>
  );
};

export default AppRoot;
