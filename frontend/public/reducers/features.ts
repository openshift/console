import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

import {
  ChargebackReportModel,
  ClusterServiceClassModel,
  ClusterServiceVersionModel,
  MachineModel,
  MachineAutoscalerModel,
  MachineConfigModel,
  OperatorSourceModel,
  PrometheusModel,
  ConsoleCLIDownloadModel,
  ConsoleNotificationModel,
} from '../models';
import { referenceForModel } from '../module/k8s';
import { ActionType as K8sActionType } from '../actions/k8s';
import { FeatureAction, ActionType } from '../actions/features';
import { FLAGS } from '../const';
import * as plugins from '../plugins';

export const defaults = _.mapValues(FLAGS, flag => flag === FLAGS.AUTH_ENABLED
  ? !window.SERVER_FLAGS.authDisabled
  : undefined
);

export const baseCRDs = {
  [referenceForModel(PrometheusModel)]: FLAGS.PROMETHEUS,
  [referenceForModel(ChargebackReportModel)]: FLAGS.CHARGEBACK,
  [referenceForModel(ClusterServiceClassModel)]: FLAGS.SERVICE_CATALOG,
  [referenceForModel(ClusterServiceVersionModel)]: FLAGS.OPERATOR_LIFECYCLE_MANAGER,
  [referenceForModel(OperatorSourceModel)]: FLAGS.OPERATOR_HUB,
  [referenceForModel(MachineModel)]: FLAGS.CLUSTER_API,
  [referenceForModel(MachineConfigModel)]: FLAGS.MACHINE_CONFIG,
  [referenceForModel(MachineAutoscalerModel)]: FLAGS.MACHINE_AUTOSCALER,
  [referenceForModel(ConsoleCLIDownloadModel)]: FLAGS.CONSOLE_CLI_DOWNLOAD,
  [referenceForModel(ConsoleNotificationModel)]: FLAGS.CONSOLE_NOTIFICATION,
};

const CRDs = { ...baseCRDs };

plugins.registry.getFeatureFlags().filter(plugins.isModelFeatureFlag).forEach(ff => {
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
      return state.merge({[action.payload.flag]: action.payload.value});

    case K8sActionType.ReceivedResources:
      // Flip all flags to false to signify that we did not see them
      _.each(CRDs, v => state = state.set(v, false));

      return action.payload.resources.models.filter(model => CRDs[referenceForModel(model)] !== undefined)
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

export const stateToProps = (desiredFlags: string[], state) => {
  const flags = desiredFlags.reduce((allFlags, f) => ({...allFlags, [f]: state[featureReducerName].get(f)}), {});
  return {flags};
};

type WithFlagsProps = {
  flags: {[key: string]: boolean};
};

export type ConnectToFlags = <P extends WithFlagsProps>(...flags: FLAGS[]) => (C: React.ComponentType<P>) =>
  React.ComponentType<Omit<P, keyof WithFlagsProps>> & {WrappedComponent: React.ComponentType<P>};
export const connectToFlags: ConnectToFlags = (...flags) => connect(state => stateToProps(flags, state), null, null, {areStatePropsEqual: _.isEqual});

// Flag detection is not complete if the flag's value is `undefined`.
export const flagPending = flag => flag === undefined;
