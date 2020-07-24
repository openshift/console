import * as _ from 'lodash';
import { K8sKind, referenceForModel } from '@console/internal/module/k8s';
import { KebabAction } from '@console/internal/components/utils';
import { EditApplication } from '@console/dev-console/src/actions/modify-application';
import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import { setTrafficDistribution } from '../actions/traffic-splitting';
import { setSinkSource } from '../actions/sink-source';
import { setSinkPubsub } from '../actions/sink-pubsub';
import {
  ServiceModel,
  EventingSubscriptionModel,
  EventingTriggerModel,
  EventingBrokerModel,
} from '../models';
import {
  getDynamicEventSourcesModelRefs,
  isEventingChannelResourceKind,
} from './fetch-dynamic-eventsources-utils';
import { addSubscription, addTrigger } from '../actions';

export const getKebabActionsForKind = (resourceKind: K8sKind): KebabAction[] => {
  const menuActions: KebabAction[] = [];
  const eventSourceModelrefs: string[] = getDynamicEventSourcesModelRefs();
  if (resourceKind) {
    if (referenceForModel(resourceKind) === referenceForModel(ServiceModel)) {
      menuActions.push(setTrafficDistribution, AddHealthChecks, EditApplication, EditHealthChecks);
    }
    if (_.includes(eventSourceModelrefs, referenceForModel(resourceKind))) {
      menuActions.push(setSinkSource);
    }
    if (
      referenceForModel(resourceKind) === referenceForModel(EventingSubscriptionModel) ||
      referenceForModel(resourceKind) === referenceForModel(EventingTriggerModel)
    ) {
      menuActions.push(setSinkPubsub);
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
