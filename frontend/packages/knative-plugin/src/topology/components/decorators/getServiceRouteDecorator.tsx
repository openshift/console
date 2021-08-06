import * as React from 'react';
import { Node } from '@patternfly/react-topology/src/types';
import { TYPE_KNATIVE_SERVICE } from '../../const';
import ServiceRouteDecorator from './ServiceRouteDecorator';

export const getServiceRouteDecorator = (element: Node, radius: number, x: number, y: number) => {
  if (element.getType() !== TYPE_KNATIVE_SERVICE || element.isCollapsed()) {
    return null;
  }
  const { data } = element.getData();
  const hasDataUrl = !!data.url;

  if (!hasDataUrl) {
    return null;
  }
  return <ServiceRouteDecorator key="service-route" url={data.url} radius={radius} x={x} y={y} />;
};
