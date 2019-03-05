/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import { RouteProps } from 'react-router';
import { AsyncComponent } from '../../components/utils';

const routes: RouteProps[] = [
  {
    path: '/devops/import',
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
    path: '/devops/codebases',
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
    path: '/devops/topology',
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
    path: '/devops',
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
