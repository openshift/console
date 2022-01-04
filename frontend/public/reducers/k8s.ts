import { Map as ImmutableMap, fromJS } from 'immutable';

import { ActionType, K8sAction } from '../actions/k8s';
import { referenceForModel } from '../module/k8s/k8s';
import { K8sKind } from '../module/k8s/types';
import { allModels } from '../module/k8s/k8s-models';
import { getNamespacedResources } from '../actions/ui';

export type K8sState = ImmutableMap<string, any>;

export default (state: K8sState, action: K8sAction): K8sState => {
  if (!state) {
    return fromJS({ RESOURCES: { inFlight: false, models: ImmutableMap<string, K8sKind>() } });
  }

  switch (action.type) {
    case ActionType.GetResourcesInFlight:
      return state.setIn(['RESOURCES', 'inFlight'], true);
    case ActionType.ReceivedResources:
      return (
        action.payload.resources.models
          .filter((model) => !state.getIn(['RESOURCES', 'models']).has(referenceForModel(model)))
          .filter((model) => {
            const existingModel = state.getIn(['RESOURCES', 'models', model.kind]);
            return !existingModel || referenceForModel(existingModel) !== referenceForModel(model);
          })
          .map((model) => {
            model.namespaced
              ? getNamespacedResources().add(referenceForModel(model))
              : getNamespacedResources().delete(referenceForModel(model));
            return model;
          })
          .reduce((prevState, newModel) => {
            // FIXME: Need to use `kind` as model reference for legacy components accessing k8s primitives
            const [modelRef, model] = allModels().findEntry(
              (staticModel) => referenceForModel(staticModel) === referenceForModel(newModel),
            ) || [referenceForModel(newModel), newModel];
            // Verbs and short names are not part of the static model definitions, so use the values found during discovery.
            return prevState.updateIn(['RESOURCES', 'models'], (models) =>
              models.set(modelRef, {
                ...model,
                verbs: newModel.verbs,
                shortNames: newModel.shortNames,
              }),
            );
          }, state)
          // TODO: Determine where these are used and implement filtering in that component instead of storing in Redux
          .setIn(['RESOURCES', 'allResources'], action.payload.resources.allResources)
          .setIn(['RESOURCES', 'safeResources'], action.payload.resources.safeResources)
          .setIn(['RESOURCES', 'adminResources'], action.payload.resources.adminResources)
          .setIn(['RESOURCES', 'configResources'], action.payload.resources.configResources)
          .setIn(
            ['RESOURCES', 'clusterOperatorConfigResources'],
            action.payload.resources.clusterOperatorConfigResources,
          )
          .setIn(['RESOURCES', 'namespacedSet'], action.payload.resources.namespacedSet)
          .setIn(['RESOURCES', 'groupToVersionMap'], action.payload.resources.groupVersionMap)
          .setIn(['RESOURCES', 'inFlight'], false)
      );

    default:
      return state;
  }
};
