import * as React from 'react';
import { connect } from 'react-redux';
import {
  Bullseye,
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateVariant,
  Split,
  SplitItem,
  Title,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { iGetCreateVMWizardTabs } from '../../selectors/immutable/selectors';
import { isStepLocked } from '../../selectors/immutable/wizard-selectors';
import {
  VMSettingsField,
  VMWizardNetwork,
  VMWizardNetworkWithWrappers,
  VMWizardTab,
} from '../../types';
import { VMNicsTable } from '../../../vm-nics/vm-nics';
import { nicTableColumnClasses } from '../../../vm-nics/utils';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { ADD_NETWORK_INTERFACE } from '../../strings/networking';
import { iGetVmSettingValue } from '../../selectors/immutable/vm-settings';
import { ProvisionSource } from '../../../../types/vm';
import { getNetworksWithWrappers } from '../../selectors/selectors';
import { wrapWithProgress } from '../../../../utils/utils';
import { vmWizardNicModalEnhanced } from './vm-wizard-nic-modal-enhanced';
import { VMWizardNicRow } from './vm-wizard-nic-row';
import { VMWizardNetworkBundle } from './types';
import { PXENetworks } from './pxe-networks';

import './networking-tab.scss';

const getNicsData = (networks: VMWizardNetworkWithWrappers[]): VMWizardNetworkBundle[] =>
  networks.map((wizardNetworkData) => {
    const { networkInterfaceWrapper, networkWrapper } = wizardNetworkData;
    return {
      wizardNetworkData,
      // for sorting
      name: networkInterfaceWrapper.getName(),
      model: networkInterfaceWrapper.getReadableModel(),
      networkName: networkWrapper.getReadableName(),
      interfaceType: networkInterfaceWrapper.getTypeValue(),
      macAddress: networkInterfaceWrapper.getMACAddress(),
    };
  });

const NetworkingTabComponent: React.FC<NetworkingTabComponentProps> = ({
  isPXENICRequired,
  wizardReduxID,
  isLocked,
  setTabLocked,
  removeNIC,
  updateNetworks,
  networks,
}) => {
  const hasNetworks = networks.length > 0;

  const withProgress = wrapWithProgress(setTabLocked);

  const addButtonProps = {
    id: 'add-nic',
    onClick: () =>
      withProgress(
        vmWizardNicModalEnhanced({
          wizardReduxID,
        }).result,
      ),
    isDisabled: isLocked,
  };

  return (
    <div className="kubevirt-create-vm-modal__networking-tab-container">
      <Split>
        <SplitItem isFilled>
          <Title headingLevel="h5" size="lg">
            Network Interfaces
          </Title>
        </SplitItem>
        {hasNetworks && (
          <SplitItem>
            <Button {...addButtonProps} variant={ButtonVariant.secondary}>
              {ADD_NETWORK_INTERFACE}
            </Button>
          </SplitItem>
        )}
      </Split>
      {hasNetworks && (
        <>
          <div className="kubevirt-create-vm-modal__networking-tab-main">
            <VMNicsTable
              columnClasses={nicTableColumnClasses}
              data={getNicsData(networks)}
              customData={{ isDisabled: isLocked, withProgress, removeNIC, wizardReduxID }}
              row={VMWizardNicRow}
            />
          </div>
          {isPXENICRequired && (
            <footer className="kubevirt-create-vm-modal__networking-tab-pxe">
              <PXENetworks
                isDisabled={isLocked}
                networks={networks}
                updateNetworks={updateNetworks}
              />
            </footer>
          )}
        </>
      )}
      {!hasNetworks && (
        <Bullseye>
          <EmptyState variant={EmptyStateVariant.full}>
            <Title headingLevel="h5" size="lg">
              No network interface added
            </Title>
            <Button {...addButtonProps} icon={<PlusCircleIcon />} variant={ButtonVariant.link}>
              {ADD_NETWORK_INTERFACE}
            </Button>
          </EmptyState>
        </Bullseye>
      )}
    </div>
  );
};

type NetworkingTabComponentProps = {
  isLocked: boolean;
  isPXENICRequired: boolean;
  wizardReduxID: string;
  networks: VMWizardNetworkWithWrappers[];
  removeNIC: (id: string) => void;
  setTabLocked: (isLocked: boolean) => void;
  updateNetworks: (networks: VMWizardNetwork[]) => void;
};

const stateToProps = (state, { wizardReduxID }) => {
  const stepData = iGetCreateVMWizardTabs(state, wizardReduxID);
  return {
    isLocked: isStepLocked(stepData, VMWizardTab.NETWORKING),
    networks: getNetworksWithWrappers(state, wizardReduxID),
    isPXENICRequired:
      iGetVmSettingValue(state, wizardReduxID, VMSettingsField.PROVISION_SOURCE_TYPE) ===
      ProvisionSource.PXE,
  };
};

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  setTabLocked: (isLocked) => {
    dispatch(
      vmWizardActions[ActionType.SetTabLocked](wizardReduxID, VMWizardTab.NETWORKING, isLocked),
    );
  },
  removeNIC: (id: string) => {
    dispatch(vmWizardActions[ActionType.RemoveNIC](wizardReduxID, id));
  },
  updateNetworks: (networks: VMWizardNetwork[]) => {
    dispatch(vmWizardActions[ActionType.SetNetworks](wizardReduxID, networks));
  },
});

export const NetworkingTab = connect(
  stateToProps,
  dispatchToProps,
)(NetworkingTabComponent);
