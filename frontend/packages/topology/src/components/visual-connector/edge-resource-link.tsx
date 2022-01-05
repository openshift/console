import { GraphElement, isEdge } from '@patternfly/react-topology';
import { getResource } from '../../utils';

export const getEdgeResourceLink = (element: GraphElement) => {
  if (!isEdge(element)) return undefined;
  const resource = getResource(element);
  if (resource) return undefined;
  return element.getLabel();
};
