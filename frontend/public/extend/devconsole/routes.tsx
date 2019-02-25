import * as React from 'react';
import { RouteProps } from 'react-router';
import { AsyncComponent } from '../../components/utils';

const routes: RouteProps[] = [
  {
    path: '/devconsole/import',
    // eslint-disable-next-line react/display-name
    render: (props) => (
      <AsyncComponent
        {...props}
        loader={async() =>
          (await import('./pages/Import' /* webpackChunkName: "devconsole-import" */)).default
        }
      />
    ),
  },
  {
    path: '/devconsole/codebases',
    // eslint-disable-next-line react/display-name
    render: (props) => (
      <AsyncComponent
        {...props}
        loader={async() =>
          (await import('./pages/Codebases' /* webpackChunkName: "devconsole-codebases" */)).default
        }
      />
    ),
  },
  {
    path: '/devconsole/topology',
    // eslint-disable-next-line react/display-name
    render: (props) => (
      <AsyncComponent
        {...props}
        loader={async() =>
          (await import('./pages/Topology' /* webpackChunkName: "devconsole-topology" */)).default
        }
      />
    ),
  },
  {
    path: '/devconsole',
    // eslint-disable-next-line react/display-name
    render: (props) => (
      <AsyncComponent
        {...props}
        loader={async() =>
          (await import('./pages/Home' /* webpackChunkName: "devconsole-home" */)).default
        }
      />
    ),
  },
];

export default routes;
