import { K8sResourceKind, Patch } from '@console/internal/module/k8s';
import { getAnnotations, getDescription } from '../../../selectors/k8sCommon';

export const getUpdateDescriptionPatches = (
  resource: K8sResourceKind,
  description: string,
): Patch[] => {
  const patches = [];
  const oldDescription = getDescription(resource);
  const annotations = getAnnotations(resource, null);

  if (description !== oldDescription) {
    if (!description && oldDescription) {
      patches.push({
        op: 'remove',
        path: '/metadata/annotations/description',
      });
    } else if (!annotations) {
      patches.push({
        op: 'add',
        path: '/metadata/annotations',
        value: {
          description,
        },
      });
    } else {
      patches.push({
        op: oldDescription ? 'replace' : 'add',
        path: '/metadata/annotations/description',
        value: description,
      });
    }
  }
  return patches;
};
