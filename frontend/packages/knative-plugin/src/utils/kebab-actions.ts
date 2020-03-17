import * as _ from 'lodash';
import { K8sKind, referenceForModel } from '@console/internal/module/k8s';
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
  EventSourceSinkBindingModel,
  ServiceModel,
} from '../models';

const modifyApplicationRefs = [
  referenceForModel(EventSourceApiServerModel),
  referenceForModel(EventSourceContainerModel),
  referenceForModel(EventSourceCronJobModel),
  referenceForModel(EventSourceCamelModel),
  referenceForModel(EventSourceKafkaModel),
  referenceForModel(EventSourceSinkBindingModel),
  referenceForModel(ServiceModel),
];

export const getKebabActionsForKind = (resourceKind: K8sKind): KebabAction[] => {
  const menuActions: KebabAction[] = [];
  if (resourceKind) {
    if (_.includes(modifyApplicationRefs, referenceForModel(resourceKind))) {
      menuActions.push(ModifyApplication);
    }
    if (referenceForModel(resourceKind) === referenceForModel(ServiceModel)) {
      menuActions.push(setTrafficDistribution, EditApplication);
    }
  }
  return menuActions;
};
