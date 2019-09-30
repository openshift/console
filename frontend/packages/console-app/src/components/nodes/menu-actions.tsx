import * as _ from 'lodash';
import { makeNodeSchedulable } from '@console/internal/module/k8s';
import { configureUnschedulableModal } from '@console/internal/components/modals';
import { Kebab } from '@console/internal/components/utils';

export const MarkAsUnschedulable = (kind, obj) => ({
  label: 'Mark as Unschedulable',
  hidden: _.get(obj, 'spec.unschedulable'),
  callback: () => configureUnschedulableModal({ resource: obj }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  },
});

export const MarkAsSchedulable = (kind, obj) => ({
  label: 'Mark as Schedulable',
  hidden: !_.get(obj, 'spec.unschedulable', false),
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
