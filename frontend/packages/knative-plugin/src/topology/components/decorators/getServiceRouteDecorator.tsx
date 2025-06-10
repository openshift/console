import { Node } from '@patternfly/react-topology/src/types';
import { ROUTE_DISABLED_ANNOTATION, ROUTE_URL_ANNOTATION } from '@console/topology/src/const';
import { getResource } from '@console/topology/src/utils';
import { PRIVATE_KNATIVE_SERVING_LABEL } from '../../../const';
import { TYPE_KNATIVE_SERVICE } from '../../const';
import ServiceRouteDecorator from './ServiceRouteDecorator';

export const getServiceRouteDecorator = (element: Node, radius: number, x: number, y: number) => {
  if (element.getType() !== TYPE_KNATIVE_SERVICE || element.isCollapsed()) {
    return null;
  }
  const resourceObj = getResource(element);
  const { data } = element.getData();

  const disabled = resourceObj?.metadata?.annotations?.[ROUTE_DISABLED_ANNOTATION] === 'true';
  const isPrivateRoute =
    resourceObj?.metadata?.labels?.[PRIVATE_KNATIVE_SERVING_LABEL] === 'cluster-local';
  const annotationURL = resourceObj?.metadata?.annotations?.[ROUTE_URL_ANNOTATION];
  const url = annotationURL || data.url;

  if (
    isPrivateRoute ||
    disabled ||
    !url ||
    !(url.startsWith('http://') || url.startsWith('https://'))
  ) {
    return null;
  }
  return <ServiceRouteDecorator key="service-route" url={url} radius={radius} x={x} y={y} />;
};
