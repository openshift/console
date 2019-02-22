import * as React from 'react';
import { RouteProps } from 'react-router';
import { AsyncComponent } from '../../components/utils';

const routes: RouteProps[] = [
  {
    path: '/devconsole/import',
    render: (props) => (
      <AsyncComponent
        {...props}
        loader={async() =>
          (await import('./pages/Import' /* webpackChunkName: "devconsole-import" */))
            .default
        }
      />
    ),
  },
  {
    path: '/devconsole/codebases',
    render: (props) => (
      <AsyncComponent
        {...props}
        loader={async() =>
          (await import('./pages/Codebases' /* webpackChunkName: "devconsole-codebases" */))
            .default
        }
      />
    ),
  },
  {
    path: '/devconsole/topology',
    render: (props) => (
      <AsyncComponent
        {...props}
        loader={async() =>
          (await import('./pages/Topology' /* webpackChunkName: "devconsole-topology" */))
            .default
        }
      />
    ),
  },
  {
    path: '/devconsole',
    render: (props) => (
      <AsyncComponent
        {...props}
        loader={async() =>
          (await import('./pages/Home' /* webpackChunkName: "devconsole-home" */))
            .default
        }
      />
    ),
  },
];

export default routes;
