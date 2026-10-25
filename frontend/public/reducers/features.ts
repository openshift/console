import * as _ from 'lodash';
import type { FeatureState } from '@console/dynamic-plugin-sdk/src/app/features';
import { ActionType as K8sActionType } from '@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s';
import type { ModelFeatureFlag } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import { isModelFeatureFlag } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import { FLAGS } from '@console/shared/src/constants/common';
import type { FeatureAction } from '../actions/flags';
import { ActionType } from '../actions/flags';
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
import type { K8sModel } from '../module/k8s';
import { referenceForGroupVersionKind, referenceForModel } from '../module/k8s/k8s-ref';
import { pluginStore } from '../plugins';
import type { RootState } from '../redux';

export type { FeatureState }; // eslint-disable-line no-barrel-files/no-barrel-files -- TODO, rewrite imports

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
    default:
      return undefined;
  }
});

const baseCRDs = {
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
  const { model } = e.properties;
  return referenceForGroupVersionKind(model.group)(model.version)(model.kind);
};

// TODO: When migrating to @openshift/dynamic-plugin-sdk, use the type parameter from
// pluginStore.getExtensions<...>() to avoid `as any` cast.
(pluginStore.getExtensions().filter(isModelFeatureFlag) as any).forEach((ff) => {
  // This is incorrect (for `ExtensionK8sModel` we should use `referenceForExtensionModel`).
  addToCRDs(referenceForModel(ff.properties.model), ff.properties.flag);
});

export const featureReducerName = 'FLAGS';
export const featureReducer = (state: FeatureState, action: FeatureAction): FeatureState => {
  if (!state) {
    return { ...defaults };
  }

  switch (action.type) {
    case ActionType.SetFlag:
      if (state[action.payload.flag] === action.payload.value) return state;
      return { ...state, [action.payload.flag]: action.payload.value };

    case ActionType.ClearSSARFlags: {
      const result = { ...state };
      action.payload.flags.forEach((flag) => delete result[flag]);
      return result;
    }

    case ActionType.UpdateModelFlags: {
      action.payload.added.forEach((e) => {
        addToCRDs(getModelRef(e), e.properties.flag);
      });

      action.payload.removed.forEach((e) => {
        delete CRDs[getModelRef(e)];
      });

      const allReferences: Set<string> = action.payload.models.reduce(
        (acc: Set<string>, curr: K8sModel) => acc.add(referenceForModel(curr)),
        new Set<string>(),
      );

      const updates: Record<string, boolean> = {};
      // Evaluate new model flags
      // TODO: Handle model flag removals (when plugin removal without a refresh is supported in console)
      action.payload.added.forEach((e) => {
        const detected = allReferences.has(getModelRef(e));
        if (detected) {
          console.log(`${e.properties.flag} was detected.`);
        }
        updates[e.properties.flag] = detected;
      });

      return { ...state, ...updates };
    }

    case K8sActionType.ReceivedResources: {
      const flagUpdates: Record<string, boolean> = {};
      _.each(CRDs, (v) => {
        flagUpdates[v] = false;
      });

      action.payload.resources.models
        .filter((model) => CRDs[referenceForModel(model)] !== undefined)
        .forEach((model) => {
          const flag = CRDs[referenceForModel(model)];
          console.log(`${flag} was detected.`);
          flagUpdates[flag] = true;
        });

      return { ...state, ...flagUpdates };
    }

    default:
      return state;
  }
};

export const getFlagsObject = ({ [featureReducerName]: featureState }: RootState): FlagsObject => ({
  ...featureState,
});

export type FlagsObject = { [key: string]: boolean };

// Flag detection is not complete if the flag's value is `undefined`.
export const flagPending = (flag: boolean) => flag === undefined;
