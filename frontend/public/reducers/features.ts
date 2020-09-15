import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

import { FLAGS } from '@console/shared/src/constants';
import { isModelFeatureFlag } from '@console/plugin-sdk/src/typings';
import {
  subscribeToExtensions,
  extensionDiffListener,
} from '@console/plugin-sdk/src/api/subscribeToExtensions';
import {
  ChargebackReportModel,
  ClusterServiceClassModel,
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
import { referenceForModel, referenceForGroupVersionKind } from '../module/k8s';
import { RootState } from '../redux';
import { ActionType as K8sActionType } from '../actions/k8s';
import { FeatureAction, ActionType } from '../actions/features';
import { pluginStore } from '../plugins';
import {
  ModelFeatureFlag as DynamicModelFeatureFlag,
  isModelFeatureFlag as isDynamicModelFeatureFlag,
} from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';

export const defaults = _.mapValues(FLAGS, (flag) =>
  flag === FLAGS.AUTH_ENABLED ? !window.SERVER_FLAGS.authDisabled : undefined,
);

export const baseCRDs = {
  [referenceForModel(ChargebackReportModel)]: FLAGS.CHARGEBACK,
  [referenceForModel(ClusterServiceClassModel)]: FLAGS.SERVICE_CATALOG,
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

pluginStore
  .getAllExtensions()
  .filter(isModelFeatureFlag)
  .forEach((ff) => {
    addToCRDs(referenceForModel(ff.properties.model), ff.properties.flag);
  });

subscribeToExtensions<DynamicModelFeatureFlag>(
  extensionDiffListener((added, removed) => {
    const getModelRef = (e: DynamicModelFeatureFlag) => {
      const model = e.properties.model;
      return referenceForGroupVersionKind(model.group)(model.version)(model.kind);
    };

    added.forEach((e) => {
      addToCRDs(getModelRef(e), e.properties.flag);
    });

    removed.forEach((e) => {
      delete CRDs[getModelRef(e)];
    });

    // TODO(vojtech): change of 'CRDs' should trigger relevant detection logic
  }),
  isDynamicModelFeatureFlag,
);

export type FeatureState = ImmutableMap<string, boolean>;

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

export const stateToFlagsObject = (state: FeatureState, desiredFlags: string[]): FlagsObject =>
  desiredFlags.reduce((allFlags, f) => ({ ...allFlags, [f]: state.get(f) }), {} as FlagsObject);

const stateToProps = (state: FeatureState, desiredFlags: string[]): WithFlagsProps => ({
  flags: stateToFlagsObject(state, desiredFlags),
});

export const getFlagsObject = ({ [featureReducerName]: featureState }: RootState): FlagsObject =>
  featureState.toObject();

export type FlagsObject = { [key: string]: boolean };

export type WithFlagsProps = {
  flags: FlagsObject;
};

export type ConnectToFlags = <P extends WithFlagsProps>(
  ...flags: (FLAGS | string)[]
) => (
  C: React.ComponentType<P>,
) => React.ComponentType<Omit<P, keyof WithFlagsProps>> & {
  WrappedComponent: React.ComponentType<P>;
};

export const connectToFlags: ConnectToFlags = (...flags) =>
  connect((state: RootState) => stateToProps(state[featureReducerName], flags), null, null, {
    areStatePropsEqual: _.isEqual,
  });

// Flag detection is not complete if the flag's value is `undefined`.
export const flagPending = (flag: boolean) => flag === undefined;
