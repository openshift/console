import { Plugin } from '@console/plugin-sdk';
import { getExecutableCodeRef } from '@console/dynamic-plugin-sdk/src/coderefs/coderef-utils';
import { TopologyDecoratorProvider } from '../../../../../extensions';
import { TopologyDecoratorQuadrant } from '../../../../../topology-types';
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
      quadrant: TopologyDecoratorQuadrant.lowerRight,
      decorator: getExecutableCodeRef(getEditDecorator),
    },
  },
  {
    type: 'Topology/Decorator',
    properties: {
      id: 'url-decorator',
      priority: 1000,
      quadrant: TopologyDecoratorQuadrant.upperRight,
      decorator: getExecutableCodeRef(getUrlDecorator),
    },
  },
  {
    type: 'Topology/Decorator',
    properties: {
      id: 'build-decorator',
      priority: 1000,
      quadrant: TopologyDecoratorQuadrant.lowerLeft,
      decorator: getExecutableCodeRef(getBuildDecorator),
    },
  },
  {
    type: 'Topology/Decorator',
    properties: {
      id: 'alerts-decorator',
      priority: 1000,
      quadrant: TopologyDecoratorQuadrant.upperLeft,
      decorator: getExecutableCodeRef(getAlertsDecorator),
    },
  },
];
