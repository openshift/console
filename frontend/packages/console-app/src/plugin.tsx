import * as React from 'react';
import { CogsIcon } from '@patternfly/react-icons';
import { Plugin, Perspective } from '@console/plugin-sdk';

type ConsumedExtensions = Perspective;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'Perspective',
    properties: {
      id: 'admin',
      name: 'Administrator',
      icon: <CogsIcon />,
      landingPageURL: '/',
      default: true,
    },
  },
];

export default plugin;
