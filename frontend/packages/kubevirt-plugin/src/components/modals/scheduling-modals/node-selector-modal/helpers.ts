import { NodeSelector } from '../../../../types';
import { IDLabel } from '../../../LabelsList/types';

export const nodeSelectorToIDLabels = (nodeSelector: NodeSelector): IDLabel[] =>
  Object.entries(nodeSelector || {}).map(([key, value], id) => ({ id, key, value }));
