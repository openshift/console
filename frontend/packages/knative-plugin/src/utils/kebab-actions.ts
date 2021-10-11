import * as _ from 'lodash';
import { KebabAction } from '@console/internal/components/utils';
import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import { K8sKind, referenceForModel } from '@console/internal/module/k8s';
import { setKnatify, addTrigger, addSubscription, setSinkSource } from '../actions';
import { CamelKameletBindingModel, EventingBrokerModel } from '../models';
import {
  getDynamicEventSourcesModelRefs,
  isEventingChannelResourceKind,
} from './fetch-dynamic-eventsources-utils';

export const getKebabActionsForKind = (resourceKind: K8sKind): KebabAction[] => {
  const menuActions: KebabAction[] = [];
  const eventSourceModelrefs: string[] = getDynamicEventSourcesModelRefs();
  if (resourceKind) {
    if (
      _.includes(eventSourceModelrefs, referenceForModel(resourceKind)) ||
      referenceForModel(resourceKind) === referenceForModel(CamelKameletBindingModel)
    ) {
      menuActions.push(setSinkSource);
    }
    if (referenceForModel(resourceKind) === referenceForModel(EventingBrokerModel)) {
      menuActions.push(addTrigger);
    }
    if (isEventingChannelResourceKind(referenceForModel(resourceKind))) {
      menuActions.push(addSubscription);
    }
  }
  return menuActions;
};

export const getKebabActionsForWorkload = (resourceKind: K8sKind): KebabAction[] => {
  const menuActions: KebabAction[] = [];
  if (
    resourceKind &&
    (referenceForModel(resourceKind) === referenceForModel(DeploymentModel) ||
      referenceForModel(resourceKind) === referenceForModel(DeploymentConfigModel))
  ) {
    menuActions.push(setKnatify);
  }
  return menuActions;
};
