import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { useFlag, getNamespace, getName } from '@console/shared';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import { State, Action } from '../reducer';
import { EncryptionFormGroup, NetworkFormGroup } from '../../install-wizard/configure';
import { NetworkType, NADSelectorType } from '../../../../types';
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

  const setNetwork = (network: NADSelectorType, resource: K8sResourceCommon) =>
    dispatch({
      type: network === NADSelectorType.CLUSTER ? 'setClusterNetwork' : 'setPublicNetwork',
      value: `${getNamespace(resource)}/${getName(resource)}`,
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
