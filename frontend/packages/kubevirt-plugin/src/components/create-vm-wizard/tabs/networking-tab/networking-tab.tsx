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
import { isStepLocked } from '../../selectors/immutable/wizard-selectors';
import { VMWizardNetworkWithWrappers, VMWizardTab } from '../../types';
import { VMNicsTable } from '../../../vm-nics/vm-nics';
import { nicTableColumnClasses } from '../../../vm-nics/utils';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { iGetProvisionSource } from '../../selectors/immutable/vm-settings';
import { getNetworksWithWrappers } from '../../selectors/selectors';
import { wrapWithProgress } from '../../../../utils/utils';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { DeviceType } from '../../../../constants/vm';
import { vmWizardNicModalEnhanced } from './vm-wizard-nic-modal-enhanced';
import { VMWizardNicRow } from './vm-wizard-nic-row';
import { VMWizardNetworkBundle } from './types';
import { NetworkBootSource } from './network-boot-source';
import { ADD_NETWORK_INTERFACE } from '../../../../utils/strings';

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
  isBootNICRequired,
  wizardReduxID,
  isLocked,
  setTabLocked,
  removeNIC,
  onBootOrderChanged,
  networks,
}) => {
  const showNetworks = networks.length > 0 || isBootNICRequired;

  const withProgress = wrapWithProgress(setTabLocked);

  const addButtonProps = {
    id: 'add-nic',
    onClick: () =>
      withProgress(
        vmWizardNicModalEnhanced({
          blocking: true,
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
        {showNetworks && (
          <SplitItem>
            <Button {...addButtonProps} variant={ButtonVariant.secondary}>
              {ADD_NETWORK_INTERFACE}
            </Button>
          </SplitItem>
        )}
      </Split>
      {showNetworks && (
        <>
          <VMNicsTable
            columnClasses={nicTableColumnClasses}
            data={getNicsData(networks)}
            customData={{ isDisabled: isLocked, withProgress, removeNIC, wizardReduxID }}
            row={VMWizardNicRow}
          />
          {isBootNICRequired && (
            <NetworkBootSource
              className="kubevirt-create-vm-modal__networking-tab-pxe"
              isDisabled={isLocked}
              networks={networks}
              onBootOrderChanged={onBootOrderChanged}
            />
          )}
        </>
      )}
      {!showNetworks && (
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
  isBootNICRequired: boolean;
  wizardReduxID: string;
  networks: VMWizardNetworkWithWrappers[];
  removeNIC: (id: string) => void;
  setTabLocked: (isLocked: boolean) => void;
  onBootOrderChanged: (deviceID: string, bootOrder: number) => void;
};

const stateToProps = (state, { wizardReduxID }) => ({
  isLocked: isStepLocked(state, wizardReduxID, VMWizardTab.NETWORKING),
  networks: getNetworksWithWrappers(state, wizardReduxID),
  isBootNICRequired: iGetProvisionSource(state, wizardReduxID) === ProvisionSource.PXE,
});

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  setTabLocked: (isLocked) => {
    dispatch(
      vmWizardActions[ActionType.SetTabLocked](wizardReduxID, VMWizardTab.NETWORKING, isLocked),
    );
  },
  removeNIC: (id: string) => {
    dispatch(vmWizardActions[ActionType.RemoveNIC](wizardReduxID, id));
  },
  onBootOrderChanged: (deviceID: string, bootOrder: number) => {
    dispatch(
      vmWizardActions[ActionType.SetDeviceBootOrder](
        wizardReduxID,
        deviceID,
        DeviceType.NIC,
        bootOrder,
      ),
    );
  },
});

export const NetworkingTab = connect(stateToProps, dispatchToProps)(NetworkingTabComponent);
