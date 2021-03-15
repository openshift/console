import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { useFlag } from '@console/shared';
import { State, Action } from '../reducer';
import { EncryptionFormGroup, NetworkFormGroup } from '../../install-wizard/configure';
import { NetworkType } from '../../../../types';
import { GUARDED_FEATURES } from '../../../../features';

export const Configure: React.FC<ConfigureProps> = ({ state, dispatch, mode }) => {
  const isMultusSupported = useFlag(GUARDED_FEATURES.OCS_MULTUS);

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
      {isMultusSupported && (
        <NetworkFormGroup
          networkType={nwType}
          setNetworkType={setNetworkType}
          setNetwork={setNetwork}
          publicNetwork={publicNetwork}
          clusterNetwork={clusterNetwork}
        />
      )}
    </Form>
  );
};

type ConfigureProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  mode: string;
};
