import type { Node } from '@patternfly/react-topology';
import { BuildDecorator } from './BuildDecorator';
import { EditDecorator } from './EditDecorator';
import { MonitoringAlertsDecorator } from './MonitoringAlertsDecorator';
import { UrlDecorator } from './UrlDecorator';

export const getEditDecorator = (element: Node, radius: number, x: number, y: number) => (
  <EditDecorator key="edit" element={element} radius={radius} x={x} y={y} />
);

export const getUrlDecorator = (element: Node, radius: number, x: number, y: number) => (
  <UrlDecorator key="url" element={element} radius={radius} x={x} y={y} />
);

export const getBuildDecorator = (element: Node, radius: number, x: number, y: number) => (
  <BuildDecorator key="build" element={element} radius={radius} x={x} y={y} />
);

export const getAlertsDecorator = (element: Node, radius: number, x: number, y: number) => (
  <MonitoringAlertsDecorator key="alerts" element={element} radius={radius} x={x} y={y} />
);
