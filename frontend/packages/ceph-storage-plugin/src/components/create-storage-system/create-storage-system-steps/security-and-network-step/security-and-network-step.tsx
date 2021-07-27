import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { useFlag, getNamespace, getName } from '@console/shared';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import { Encryption } from './encryption';
import { NetworkType, NADSelectorType } from '../../../../types';
import { GUARDED_FEATURES } from '../../../../features';
import { WizardDispatch, WizardState } from '../../reducer';
import { NetworkFormGroup } from '../../../ocs-install/install-wizard/configure';

export const SecurityAndNetwork: React.FC<SecurityAndNetworkProps> = ({ state, dispatch }) => {
  const isMultusSupported = useFlag(GUARDED_FEATURES.OCS_MULTUS);

  const { networkType: nwType, clusterNetwork, publicNetwork } = state;

  const setNetworkType = (networkType: NetworkType) => {
    dispatch({ type: 'securityAndNetwork/setNetworkType', payload: networkType });
    if (networkType === NetworkType.DEFAULT) {
      dispatch({ type: 'securityAndNetwork/setClusterNetwork', payload: '' });
      dispatch({ type: 'securityAndNetwork/setPublicNetwork', payload: '' });
    }
  };

  const setNetwork = (network: NADSelectorType, resource: K8sResourceCommon) =>
    dispatch({
      type:
        network === NADSelectorType.CLUSTER
          ? 'securityAndNetwork/setClusterNetwork'
          : 'securityAndNetwork/setPublicNetwork',
      payload: `${getNamespace(resource)}/${getName(resource)}`,
    });

  return (
    <Form noValidate={false}>
      <Encryption state={state} dispatch={dispatch} />
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

type SecurityAndNetworkProps = {
  state: WizardState['securityAndNetwork'];
  dispatch: WizardDispatch;
};
