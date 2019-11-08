import * as _ from 'lodash';
import { K8sKind, referenceFor } from '@console/internal/module/k8s';
import { KebabAction } from '@console/internal/components/utils';
import { ModifyApplication } from '@console/dev-console/src/actions/modify-application';
import {
  EventSourceApiServerModel,
  EventSourceCamelModel,
  EventSourceContainerModel,
  EventSourceCronJobModel,
  EventSourceKafkaModel,
  ServiceModel,
} from '../models';

const modifyApplicationRefs = [
  referenceFor(EventSourceApiServerModel),
  referenceFor(EventSourceContainerModel),
  referenceFor(EventSourceCronJobModel),
  referenceFor(EventSourceCamelModel),
  referenceFor(EventSourceKafkaModel),
  referenceFor(ServiceModel),
];

export const getKebabActionsForKind = (resourceKind: K8sKind): KebabAction[] => {
  if (!resourceKind) {
    // no common actions
    return [];
  }

  return _.includes(modifyApplicationRefs, referenceFor(resourceKind)) ? [ModifyApplication] : [];
};
