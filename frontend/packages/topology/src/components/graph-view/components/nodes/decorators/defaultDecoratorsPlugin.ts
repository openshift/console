import { TopologyQuadrant } from '@patternfly/react-topology/dist/esm/types';
import { applyCodeRefSymbol } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-resolver';
import { Plugin } from '@console/plugin-sdk';
import { TopologyDecoratorProvider } from '../../../../../extensions';
import {
  getAlertsDecorator,
  getBuildDecorator,
  getEditDecorator,
  getUrlDecorator,
} from './getDefaultDecorators';

export const defaultDecoratorsPlugin: Plugin<TopologyDecoratorProvider> = [
  {
    type: 'Topology/Decorator',
    properties: {
      id: 'edit-decorator',
      priority: 1000,
      quadrant: TopologyQuadrant.lowerRight,
      decorator: applyCodeRefSymbol(getEditDecorator),
    },
  },
  {
    type: 'Topology/Decorator',
    properties: {
      id: 'url-decorator',
      priority: 1000,
      quadrant: TopologyQuadrant.upperRight,
      decorator: applyCodeRefSymbol(getUrlDecorator),
    },
  },
  {
    type: 'Topology/Decorator',
    properties: {
      id: 'build-decorator',
      priority: 1000,
      quadrant: TopologyQuadrant.lowerLeft,
      decorator: applyCodeRefSymbol(getBuildDecorator),
    },
  },
  {
    type: 'Topology/Decorator',
    properties: {
      id: 'alerts-decorator',
      priority: 1000,
      quadrant: TopologyQuadrant.upperLeft,
      decorator: applyCodeRefSymbol(getAlertsDecorator),
    },
  },
];
