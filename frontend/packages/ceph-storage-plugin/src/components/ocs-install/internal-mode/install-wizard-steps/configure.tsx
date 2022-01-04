import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { useFlag, getNamespace, getName } from '@console/shared';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import { InternalClusterAction, InternalClusterState, ActionType } from '../reducer';
import { EncryptionFormGroup, NetworkFormGroup } from '../../install-wizard/configure';
import { NetworkType, NADSelectorType } from '../../../../types';
import { FEATURES } from '../../../../features';

export const Configure: React.FC<ConfigureProps> = ({ state, dispatch, mode }) => {
  const isMultusSupported = useFlag(FEATURES.OCS_MULTUS);

  const { networkType: nwType, publicNetwork, clusterNetwork } = state;

  const setNetworkType = (networkType: NetworkType) => {
    dispatch({ type: ActionType.SET_NETWORK_TYPE, payload: networkType });
    if (networkType === NetworkType.DEFAULT) {
      dispatch({ type: ActionType.SET_CLUSTER_NETWORK, payload: '' });
      dispatch({ type: ActionType.SET_PUBLIC_NETWORK, payload: '' });
    }
  };
  const setNetwork = (network: NADSelectorType, resource: K8sResourceCommon) => {
    dispatch({
      type:
        network === NADSelectorType.CLUSTER
          ? ActionType.SET_CLUSTER_NETWORK
          : ActionType.SET_PUBLIC_NETWORK,
      payload: `${getNamespace(resource)}/${getName(resource)}`,
    });
  };

  return (
    <Form noValidate={false}>
      <EncryptionFormGroup state={state} dispatch={dispatch} mode={mode} />
      {isMultusSupported && (
        <NetworkFormGroup
          setNetworkType={setNetworkType}
          setNetwork={setNetwork}
          networkType={nwType}
          publicNetwork={publicNetwork}
          clusterNetwork={clusterNetwork}
        />
      )}
    </Form>
  );
};

type ConfigureProps = {
  state: InternalClusterState;
  dispatch: React.Dispatch<InternalClusterAction>;
  mode: string;
};
