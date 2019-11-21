import { K8sKind, NodeKind } from '@console/internal/module/k8s';
import { Kebab, KebabAction } from '@console/internal/components/utils';
import { isNodeUnschedulable } from '@console/shared';
import { makeNodeSchedulable } from '../../k8s/requests/nodes';
import { createConfigureUnschedulableModal } from './modals';

export const MarkAsUnschedulable: KebabAction = (kind: K8sKind, obj: NodeKind) => ({
  label: 'Mark as Unschedulable',
  hidden: isNodeUnschedulable(obj),
  callback: () => createConfigureUnschedulableModal({ resource: obj }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  },
});

export const MarkAsSchedulable: KebabAction = (
  kind: K8sKind,
  obj: NodeKind,
  resources: {},
  { nodeMaintenance } = { nodeMaintenance: false }, // NOTE: used by node actions in metal3-plugin
) => ({
  label: 'Mark as Schedulable',
  hidden: !isNodeUnschedulable(obj) || nodeMaintenance,
  callback: () => makeNodeSchedulable(obj),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  },
});

const { ModifyLabels, ModifyAnnotations, Edit } = Kebab.factory;
export const menuActions = [
  MarkAsSchedulable,
  MarkAsUnschedulable,
  ModifyLabels,
  ModifyAnnotations,
  Edit,
];
