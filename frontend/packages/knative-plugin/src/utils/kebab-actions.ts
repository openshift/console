import * as _ from 'lodash';
import { K8sKind, referenceForModel } from '@console/internal/module/k8s';
import { KebabAction } from '@console/internal/components/utils';
import {
  ModifyApplication,
  EditApplication,
} from '@console/dev-console/src/actions/modify-application';
import { ModifyHealthChecks } from '@console/app/src/actions/modify-health-checks';
import { setTrafficDistribution } from '../actions/traffic-splitting';
import { setSinkSource } from '../actions/sink-source';
import { ServiceModel } from '../models';
import { getDynamicEventSourcesModelRefs } from './fetch-dynamic-eventsources-utils';

export const getKebabActionsForKind = (resourceKind: K8sKind): KebabAction[] => {
  const menuActions: KebabAction[] = [];
  const eventSourceModelrefs: string[] = getDynamicEventSourcesModelRefs();
  const modifyApplicationRefs: string[] = [
    ...eventSourceModelrefs,
    referenceForModel(ServiceModel),
  ];
  if (resourceKind) {
    if (_.includes(modifyApplicationRefs, referenceForModel(resourceKind))) {
      menuActions.push(ModifyApplication);
    }
    if (referenceForModel(resourceKind) === referenceForModel(ServiceModel)) {
      menuActions.push(setTrafficDistribution, ModifyHealthChecks, EditApplication);
    }
    if (_.includes(eventSourceModelrefs, referenceForModel(resourceKind))) {
      menuActions.push(setSinkSource);
    }
  }
  return menuActions;
};
