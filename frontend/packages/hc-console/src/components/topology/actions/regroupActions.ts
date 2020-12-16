import { KebabOption } from '@console/internal/components/utils/kebab';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { Node } from '@console/topology';
import { editApplicationModal, groupEditApplicationModal } from '../../modals';

export const regroupActions = (obj: Node, regroupChildren: boolean = false): KebabOption[] => {
  if (regroupChildren) {
    return [
      {
        label: 'Edit Application Grouping',
        callback: () =>
          groupEditApplicationModal({
            group: obj,
            blocking: true,
          }),
      },
    ];
  }
  const resource = obj.getData()?.resources?.obj;
  if (!resource) {
    return [];
  }
  const resourceKind = modelFor(referenceFor(resource));
  return [
    {
      label: 'Edit Application Grouping',
      callback: () =>
        editApplicationModal({
          resourceKind,
          resource,
          blocking: true,
        }),
    },
  ];
};
