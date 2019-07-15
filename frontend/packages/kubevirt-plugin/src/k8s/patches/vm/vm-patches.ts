import { Patch } from '@console/internal/module/k8s';
import { VMLikeEntityKind } from '../../../types';
import { getAnnotations, getDescription } from '../../../selectors/selectors';

export const getUpdateDescriptionPatches = (
  vmLikeEntity: VMLikeEntityKind,
  description: string,
): Patch[] => {
  const patches = [];
  const oldDescription = getDescription(vmLikeEntity);
  const annotations = getAnnotations(vmLikeEntity, null);

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
