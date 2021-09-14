import { GraphElement, isEdge } from '@patternfly/react-topology';
import i18next from 'i18next';
import { getResource } from '../../utils';

export const getEdgeResourceLink = (element: GraphElement) => {
  if (!isEdge(element)) return undefined;
  const resource = getResource(element);
  if (resource) return undefined;
  return i18next.t('topology~{{label}}', { label: element.getLabel() });
};
