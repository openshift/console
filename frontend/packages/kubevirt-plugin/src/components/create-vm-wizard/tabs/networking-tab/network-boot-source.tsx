import * as React from 'react';
import { Form, FormSelect, FormSelectOption } from '@patternfly/react-core';
import { ValidationErrorType } from '@console/shared';
import { VMWizardNetwork } from '../../types';
import { PXE_INFO, PXE_NIC_NOT_FOUND_ERROR, SELECT_PXE_NIC } from '../../strings/networking';
import { FormRow } from '../../../form/form-row';
import { FormSelectPlaceholderOption } from '../../../form/form-select-placeholder-option';
import { ignoreCaseSort } from '../../../../utils/sort';
import { NetworkWrapper } from '../../../../k8s/wrapper/vm/network-wrapper';
import { NetworkInterfaceWrapper } from '../../../../k8s/wrapper/vm/network-interface-wrapper';

const PXE_BOOTSOURCE_ID = 'pxe-bootsource';

type NetworkBootSourceProps = {
  isDisabled: boolean;
  networks: VMWizardNetwork[];
  onBootOrderChanged: (deviceID: string, bootOrder: number) => void;
  className?: string;
};

export const NetworkBootSource: React.FC<NetworkBootSourceProps> = ({
  isDisabled,
  onBootOrderChanged,
  networks,
  className,
}) => {
  const pxeNetworks = networks
    .map(({ networkInterface, network, id }) => ({
      networkInterfaceWrapper: new NetworkInterfaceWrapper(networkInterface),
      networkWrapper: new NetworkWrapper(network),
      id,
    }))
    .filter((n) => !n.networkWrapper.isPodNetwork());

  const hasPXENetworks = pxeNetworks.length > 0;

  const selectedPXE = pxeNetworks.find((network) =>
    network.networkInterfaceWrapper.isFirstBootableDevice(),
  );

  return (
    <Form className={className}>
      <FormRow
        title="Boot Source"
        fieldId={PXE_BOOTSOURCE_ID}
        validationMessage={!hasPXENetworks && PXE_NIC_NOT_FOUND_ERROR}
        validationType={!hasPXENetworks && ValidationErrorType.Error}
        isRequired
        help={PXE_INFO}
      >
        <FormSelect
          id={PXE_BOOTSOURCE_ID}
          value={selectedPXE ? selectedPXE.id : ''}
          onChange={(id) => onBootOrderChanged(id, 1)}
          isRequired
          isDisabled={isDisabled}
        >
          <FormSelectPlaceholderOption isDisabled placeholder={SELECT_PXE_NIC} />
          {ignoreCaseSort(pxeNetworks, null, (n) => n.networkInterfaceWrapper.getName()).map(
            (network) => (
              <FormSelectOption
                key={network.id}
                value={network.id}
                label={network.networkWrapper.getName()}
              />
            ),
          )}
        </FormSelect>
      </FormRow>
    </Form>
  );
};
