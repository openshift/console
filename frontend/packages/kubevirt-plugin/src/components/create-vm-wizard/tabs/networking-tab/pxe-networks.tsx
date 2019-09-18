import * as React from 'react';
import { Form, FormSelect, FormSelectOption } from '@patternfly/react-core';
import { VMWizardNetwork, VMWizardNetworkType, VMWizardNetworkWithWrappers } from '../../types';
import { NetworkInterfaceWrapper } from '../../../../k8s/wrapper/vm/network-interface-wrapper';
import { PXE_INFO, PXE_NIC_NOT_FOUND_ERROR, SELECT_PXE_NIC } from '../../strings/networking';
import { FormRow } from '../../../form/form-row';
import { ValidationErrorType } from '../../../../utils/validations/types';
import { FormSelectPlaceholderOption } from '../../../form/form-select-placeholder-option';
import { ignoreCaseSort } from '../../../../utils/sort';

import './networking-tab.scss';

const PXE_BOOTSOURCE_ID = 'pxe-bootsource';

type PXENetworksProps = {
  isDisabled: boolean;
  networks: VMWizardNetworkWithWrappers[];
  updateNetworks: (networks: VMWizardNetwork[]) => void;
};

export const PXENetworks: React.FC<PXENetworksProps> = ({
  isDisabled,
  updateNetworks,
  networks,
}) => {
  const pxeNetworks = networks.filter((n) => !n.networkWrapper.isPodNetwork());
  const hasPXENetworks = pxeNetworks.length > 0;

  const selectedPXE = pxeNetworks.find((network) =>
    network.networkInterfaceWrapper.isFirstBootableDevice(),
  );

  const onPXENetworkChange = (id: string) => {
    const bootOrderIndexes = networks
      .map((wizardNetwork) =>
        wizardNetwork.id === id || wizardNetwork.type !== VMWizardNetworkType.TEMPLATE
          ? null
          : wizardNetwork.networkInterfaceWrapper.getBootOrder(),
      )
      .filter((b) => b != null)
      .sort();
    updateNetworks(
      // TODO: include disks in the computation and maybe move somewhere else (state update)
      networks.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ networkInterfaceWrapper, networkWrapper: unused, ...wizardNetwork }) => {
          if (wizardNetwork.id === id || networkInterfaceWrapper.hasBootOrder()) {
            return {
              ...wizardNetwork,
              networkInterface: NetworkInterfaceWrapper.mergeWrappers(
                networkInterfaceWrapper,
                NetworkInterfaceWrapper.initializeFromSimpleData({
                  bootOrder:
                    wizardNetwork.id === id
                      ? 1
                      : bootOrderIndexes.indexOf(networkInterfaceWrapper.getBootOrder()) + 2,
                }),
              ).asResource(),
            };
          }
          return wizardNetwork;
        },
      ),
    );
  };

  return (
    <Form>
      <FormRow
        title="PXE Boot Source"
        fieldId={PXE_BOOTSOURCE_ID}
        validationMessage={!hasPXENetworks && PXE_NIC_NOT_FOUND_ERROR}
        validationType={!hasPXENetworks && ValidationErrorType.Error}
        isRequired
        help={PXE_INFO}
      >
        <FormSelect
          id={PXE_BOOTSOURCE_ID}
          value={selectedPXE ? selectedPXE.id : ''}
          onChange={onPXENetworkChange}
          isRequired
          isDisabled={isDisabled}
        >
          <FormSelectPlaceholderOption isDisabled placeholder={SELECT_PXE_NIC} />
          {ignoreCaseSort(pxeNetworks, null, (n) => n.networkWrapper.getReadableName()).map(
            (network) => (
              <FormSelectOption
                key={network.id}
                value={network.id}
                label={network.networkWrapper.getReadableName()}
              />
            ),
          )}
        </FormSelect>
      </FormRow>
    </Form>
  );
};
