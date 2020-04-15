import * as _ from 'lodash';
import { referenceForModel } from '@console/internal/module/k8s';
import { KebabAction } from '@console/internal/components/utils';
import {
  ModifyApplication,
  EditApplication,
} from '@console/dev-console/src/actions/modify-application';
import { GetResourceActions } from '@console/plugin-sdk';
import { setTrafficDistribution } from '../actions/traffic-splitting';
import { setSinkSource } from '../actions/sink-source';
import {
  EventSourceApiServerModel,
  EventSourceCamelModel,
  EventSourceContainerModel,
  EventSourceCronJobModel,
  EventSourceKafkaModel,
  EventSourceSinkBindingModel,
  ServiceModel,
} from '../models';

const eventSourceModelrefs = [
  referenceForModel(EventSourceApiServerModel),
  referenceForModel(EventSourceContainerModel),
  referenceForModel(EventSourceCronJobModel),
  referenceForModel(EventSourceCamelModel),
  referenceForModel(EventSourceKafkaModel),
  referenceForModel(EventSourceSinkBindingModel),
];
const modifyApplicationRefs = [...eventSourceModelrefs, referenceForModel(ServiceModel)];

export const getResourceActions: GetResourceActions = (resourceKind) => {
  const menuActions: KebabAction[] = [];
  if (resourceKind) {
    if (_.includes(modifyApplicationRefs, referenceForModel(resourceKind))) {
      menuActions.push(ModifyApplication);
    }
    if (referenceForModel(resourceKind) === referenceForModel(ServiceModel)) {
      menuActions.push(setTrafficDistribution, EditApplication);
    }
    if (_.includes(eventSourceModelrefs, referenceForModel(resourceKind))) {
      menuActions.push(setSinkSource);
    }
  }
  return menuActions;
};
