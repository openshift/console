import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { State, Action } from '../state';
import { EncryptionFormGroup, NetworkFormGroup } from '../../../install-wizard/configure';
import { NetworkType } from '../../../types';

export const Configure: React.FC<ConfigureProps> = ({ state, dispatch, mode }) => {
  const { networkType: nwType, clusterNetwork, publicNetwork } = state;

  const setNetworkType = (networkType: NetworkType) => {
    dispatch({ type: 'setNetworkType', value: networkType });
    if (networkType === NetworkType.DEFAULT) {
      dispatch({ type: 'setClusterNetwork', value: '' });
      dispatch({ type: 'setPublicNetwork', value: '' });
    }
  };

  const setNetwork = (network: 'Cluster' | 'Public', NADName: string) =>
    dispatch({
      type: network === 'Cluster' ? 'setClusterNetwork' : 'setPublicNetwork',
      value: NADName,
    });

  return (
    <Form noValidate={false}>
      <EncryptionFormGroup state={state} dispatch={dispatch} mode={mode} />
      <NetworkFormGroup
        networkType={nwType}
        setNetworkType={setNetworkType}
        setNetwork={setNetwork}
        publicNetwork={publicNetwork}
        clusterNetwork={clusterNetwork}
      />
    </Form>
  );
};

type ConfigureProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  mode: string;
};
