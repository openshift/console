import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { InternalClusterAction, InternalClusterState, ActionType } from '../reducer';
import { EncryptionFormGroup, NetworkFormGroup } from '../../install-wizard/configure';
import { NetworkType } from '../../types';

export const Configure: React.FC<ConfigureProps> = ({ state, dispatch, mode }) => {
  const { networkType: nwType, publicNetwork, clusterNetwork } = state;

  const setNetworkType = (networkType: NetworkType) =>
    dispatch({ type: ActionType.SET_NETWORK_TYPE, payload: networkType });

  const setNetwork = (type, payload) =>
    type === 'Cluster'
      ? dispatch({ type: ActionType.SET_CLUSTER_NETWORK, payload })
      : dispatch({ type: ActionType.SET_PUBLIC_NETWORK, payload });

  return (
    <Form noValidate={false}>
      <EncryptionFormGroup state={state} dispatch={dispatch} mode={mode} />
      <NetworkFormGroup
        setNetworkType={setNetworkType}
        setNetwork={setNetwork}
        networkType={nwType}
        publicNetwork={publicNetwork}
        clusterNetwork={clusterNetwork}
      />
    </Form>
  );
};

type ConfigureProps = {
  state: InternalClusterState;
  dispatch: React.Dispatch<InternalClusterAction>;
  mode: string;
};
