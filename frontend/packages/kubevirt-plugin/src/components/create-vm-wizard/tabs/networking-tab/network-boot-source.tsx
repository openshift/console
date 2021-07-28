import * as React from 'react';
import { Form, FormSelect, FormSelectOption } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { NetworkInterfaceWrapper } from '../../../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../../../k8s/wrapper/vm/network-wrapper';
import { ValidationErrorType } from '../../../../selectors';
import { ignoreCaseSort } from '../../../../utils/sort';
import { FormRow } from '../../../form/form-row';
import { FormSelectPlaceholderOption } from '../../../form/form-select-placeholder-option';
import { VMWizardNetwork } from '../../types';

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
  const { t } = useTranslation();
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
        title={t('kubevirt-plugin~Boot Source')}
        fieldId={PXE_BOOTSOURCE_ID}
        validationMessage={
          !hasPXENetworks &&
          t('kubevirt-plugin~A PXE-capable network interface could not be found.')
        }
        validationType={!hasPXENetworks && ValidationErrorType.Error}
        isRequired
        help={t('kubevirt-plugin~Pod network is not PXE bootable')}
      >
        <FormSelect
          id={PXE_BOOTSOURCE_ID}
          value={selectedPXE ? selectedPXE.id : ''}
          onChange={(id) => onBootOrderChanged(id, 1)}
          isRequired
          isDisabled={isDisabled}
        >
          <FormSelectPlaceholderOption
            isDisabled
            placeholder={t('kubevirt-plugin~--- Select PXE network interface ---')}
          />
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
