import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

import {
  ChargebackReportModel,
  ClusterServiceClassModel,
  ConsoleCLIDownloadModel,
  ConsoleExternalLogLinkModel,
  ConsoleNotificationModel,
  ConsoleYAMLSampleModel,
  MachineAutoscalerModel,
  MachineConfigModel,
  MachineHealthCheckModel,
  MachineModel,
  PrometheusModel,
} from '../models';
import { referenceForModel } from '../module/k8s';
import { RootState } from '../redux';
import { ActionType as K8sActionType } from '../actions/k8s';
import { FeatureAction, ActionType } from '../actions/features';
import { FLAGS } from '../const';
import * as plugins from '../plugins';

export const defaults = _.mapValues(FLAGS, (flag) =>
  flag === FLAGS.AUTH_ENABLED ? !window.SERVER_FLAGS.authDisabled : undefined,
);

export const baseCRDs = {
  [referenceForModel(ChargebackReportModel)]: FLAGS.CHARGEBACK,
  [referenceForModel(ClusterServiceClassModel)]: FLAGS.SERVICE_CATALOG,
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

plugins.registry
  .getFeatureFlags()
  .filter(plugins.isModelFeatureFlag)
  .forEach((ff) => {
    const modelRef = referenceForModel(ff.properties.model);
    if (!CRDs[modelRef]) {
      CRDs[modelRef] = ff.properties.flag as FLAGS;
    }
  });

export type FeatureState = ImmutableMap<string, boolean>;

export const featureReducerName = 'FLAGS';
export const featureReducer = (state: FeatureState, action: FeatureAction): FeatureState => {
  if (!state) {
    return ImmutableMap(defaults);
  }

  switch (action.type) {
    case ActionType.SetFlag:
      if (!FLAGS[action.payload.flag]) {
        throw new Error(`unknown key for reducer ${action.payload.flag}`);
      }
      return state.merge({ [action.payload.flag]: action.payload.value });

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

export const stateToFlagsObject = (state: RootState): FlagsObject =>
  state[featureReducerName].toObject();

export const stateToProps = (desiredFlags: string[], state: RootState): WithFlagsProps => ({
  flags: _.pick(stateToFlagsObject(state), desiredFlags),
});

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
  connect(
    (state: RootState) => stateToProps(flags, state),
    null,
    null,
    { areStatePropsEqual: _.isEqual },
  );

// Flag detection is not complete if the flag's value is `undefined`.
export const flagPending = (flag) => flag === undefined;
