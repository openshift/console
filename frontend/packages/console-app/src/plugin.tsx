import * as React from 'react';
import { CogsIcon } from '@patternfly/react-icons';
import { Plugin, Perspective, DashboardsOverviewResourceActivity } from '@console/plugin-sdk';
import { FLAGS } from '@console/internal/const';
import { ClusterVersionModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  isClusterUpdateActivity,
  getClusterUpdateTimestamp,
} from './components/dashboards-page/ClusterUpdateActivity';

type ConsumedExtensions = Perspective | DashboardsOverviewResourceActivity;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'Perspective',
    properties: {
      id: 'admin',
      name: 'Administrator',
      icon: <CogsIcon />,
      getLandingPageURL: (flags) =>
        flags[FLAGS.CAN_LIST_NS] ? '/dashboards' : '/k8s/cluster/projects',
      getK8sLandingPageURL: () => '/dashboards',
      default: true,
      getImportRedirectURL: (project) => `/k8s/cluster/projects/${project}/workloads`,
    },
  },
  {
    type: 'Dashboards/Overview/Activity/Resource',
    properties: {
      k8sResource: {
        isList: true,
        prop: 'clusterVersion',
        kind: referenceForModel(ClusterVersionModel),
        namespaced: false,
      },
      isActivity: isClusterUpdateActivity,
      getTimestamp: getClusterUpdateTimestamp,
      loader: () =>
        import(
          './components/dashboards-page/ClusterUpdateActivity' /* webpackChunkName: "console-app" */
        ).then((m) => m.default),
      required: FLAGS.OPENSHIFT,
    },
  },
];

export default plugin;
