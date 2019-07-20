import * as React from 'react';
import { CogsIcon } from '@patternfly/react-icons';
import { Plugin, Perspective } from '@console/plugin-sdk';
import { FLAGS } from '@console/internal/const';

type ConsumedExtensions = Perspective;

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
];

export default plugin;
