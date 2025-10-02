import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

import { FLAGS } from '@console/shared/src/constants';
import {
  isModelFeatureFlag,
  ModelFeatureFlag,
} from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import {
  ClusterAutoscalerModel,
  ConsoleCLIDownloadModel,
  ConsoleExternalLogLinkModel,
  ConsoleLinkModel,
  ConsoleNotificationModel,
  ConsoleYAMLSampleModel,
  MachineAutoscalerModel,
  MachineConfigModel,
  MachineHealthCheckModel,
  MachineModel,
  PrometheusModel,
} from '../models';
import { K8sModel } from '../module/k8s';
import { referenceForGroupVersionKind, referenceForModel } from '../module/k8s/k8s-ref';
import { RootState } from '../redux';
import { ActionType as K8sActionType } from '@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s';
import { FeatureState } from '@console/dynamic-plugin-sdk/src/app/features';
import { FeatureAction, ActionType } from '../actions/flags';
import { pluginStore } from '../plugins';

// eslint-disable-next-line prettier/prettier
export type { FeatureState };

export const defaults = _.mapValues(FLAGS, (flag) => {
  switch (flag) {
    case FLAGS.AUTH_ENABLED:
      return !window.SERVER_FLAGS.authDisabled;
    case FLAGS.MONITORING:
      return (
        !!window.SERVER_FLAGS.prometheusBaseURL && !!window.SERVER_FLAGS.prometheusTenancyBaseURL
      );
    case FLAGS.DEVCONSOLE_PROXY:
      return true;
    case FLAGS.IMPERSONATE: {
      // FIXME: Check localStorage for override, default to false (disabled)
      const localStorageValue = localStorage.getItem('bridge/impersonate-enabled');
      if (localStorageValue === 'true') {
        // eslint-disable-next-line no-console
        console.log('[Feature Flag] Impersonation enabled via localStorage');
        return true;
      }
      // eslint-disable-next-line no-console
      console.log('[Feature Flag] Impersonation disabled (default or localStorage=false)');
      return false;
    }
    default:
      return undefined;
  }
});

export const baseCRDs = {
  [referenceForModel(ClusterAutoscalerModel)]: FLAGS.CLUSTER_AUTOSCALER,
  [referenceForModel(ConsoleLinkModel)]: FLAGS.CONSOLE_LINK,
  [referenceForModel(ConsoleCLIDownloadModel)]: FLAGS.CONSOLE_CLI_DOWNLOAD,
  [referenceForModel(ConsoleExternalLogLinkModel)]: FLAGS.CONSOLE_EXTERNAL_LOG_LINK,
  [referenceForModel(ConsoleNotificationModel)]: FLAGS.CONSOLE_NOTIFICATION,
  [referenceForModel(ConsoleYAMLSampleModel)]: FLAGS.CONSOLE_YAML_SAMPLE,
  [referenceForModel(MachineAutoscalerModel)]: FLAGS.MACHINE_AUTOSCALER,
  [referenceForModel(MachineConfigModel)]: FLAGS.MACHINE_CONFIG,
  [referenceForModel(MachineHealthCheckModel)]: FLAGS.MACHINE_HEALTH_CHECK,
  [referenceForModel(MachineModel)]: FLAGS.CLUSTER_API,
  [referenceForModel(PrometheusModel)]: FLAGS.PROMETHEUS,
};

const CRDs = { ...baseCRDs };

const addToCRDs = (ref: string, flag: string) => {
  if (!CRDs[ref]) {
    CRDs[ref] = flag as FLAGS;
  }
};

const getModelRef = (e: ModelFeatureFlag) => {
  const model = e.properties.model;
  return referenceForGroupVersionKind(model.group)(model.version)(model.kind);
};

pluginStore
  .getExtensionsInUse()
  .filter(isModelFeatureFlag)
  .forEach((ff) => {
    addToCRDs(referenceForModel(ff.properties.model), ff.properties.flag);
  });

export const featureReducerName = 'FLAGS';
export const featureReducer = (state: FeatureState, action: FeatureAction): FeatureState => {
  if (!state) {
    return ImmutableMap(defaults);
  }

  switch (action.type) {
    case ActionType.SetFlag:
      return state.set(action.payload.flag, action.payload.value);

    case ActionType.ClearSSARFlags:
      return state.withMutations((s) =>
        action.payload.flags.reduce((acc, curr) => acc.remove(curr), s),
      );

    case ActionType.UpdateModelFlags:
      action.payload.added.forEach((e) => {
        addToCRDs(getModelRef(e), e.properties.flag);
      });

      action.payload.removed.forEach((e) => {
        delete CRDs[getModelRef(e)];
      });

      return state.withMutations((s) => {
        const allReferences: Set<string> = action.payload.models.reduce(
          (acc: Set<string>, curr: K8sModel) => acc.add(referenceForModel(curr)),
          new Set<string>(),
        );

        // Evaluate new model flags
        // TODO: Handle model flag removals (when plugin removal without a refresh is supported in console)
        return action.payload.added.reduce((nextState, e) => {
          const detected = allReferences.has(getModelRef(e));
          if (detected) {
            // eslint-disable-next-line no-console
            console.log(`${e.properties.flag} was detected.`);
          }
          return nextState.set(e.properties.flag, detected);
        }, s);
      });

    case K8sActionType.ReceivedResources:
      // Flip all flags to false to signify that we did not see them
      _.each(CRDs, (v) => (state = state.set(v, false)));

      return action.payload.resources.models
        .filter((model) => CRDs[referenceForModel(model)] !== undefined)
        .reduce((nextState, model) => {
          const flag = CRDs[referenceForModel(model)];
          // eslint-disable-next-line no-console
          console.log(`${flag} was detected.`);

          return nextState.set(flag, true);
        }, state);

    default:
      return state;
  }
};

export const getFlagsObject = ({ [featureReducerName]: featureState }: RootState): FlagsObject =>
  featureState.toObject();

export type FlagsObject = { [key: string]: boolean };

// Flag detection is not complete if the flag's value is `undefined`.
export const flagPending = (flag: boolean) => flag === undefined;
