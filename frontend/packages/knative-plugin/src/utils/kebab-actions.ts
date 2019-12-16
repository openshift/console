import * as _ from 'lodash';
import { K8sKind, referenceFor } from '@console/internal/module/k8s';
import { KebabAction } from '@console/internal/components/utils';
import {
  ModifyApplication,
  EditApplication,
} from '@console/dev-console/src/actions/modify-application';
import { setTrafficDistribution } from '../actions/traffic-splitting';
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
  const menuActions: KebabAction[] = [];
  if (resourceKind) {
    if (_.includes(modifyApplicationRefs, referenceFor(resourceKind))) {
      menuActions.push(ModifyApplication);
    }
    if (resourceKind.kind === ServiceModel.kind) {
      menuActions.push(setTrafficDistribution, EditApplication);
    }
  }
  return menuActions;
};
