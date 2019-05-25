import * as React from 'react';
import { CogIcon } from '@patternfly/react-icons';
import {
  Plugin,
  Perspective,
} from '@console/plugin-sdk';

type ConsumedExtensions =
  | Perspective;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'Perspective',
    properties: {
      id: 'admin',
      name: 'Administrator',
      icon: <CogIcon />,
      landingPageURL: '/',
      default: true,
    },
  },
];

export default plugin;
