import * as React from 'react';
import {
  Button,
  GridItem,
  HelperText,
  HelperTextItem,
  SelectGroup,
  SelectOption,
  TextInput,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useHyperconvergedCR } from '../../hooks/use-hyperconverged-resource';
import FilteredSelect from '../FilteredSelect/FilteredSelect';
import HWContext from '../modals/hardware-devices/hardware-devices-context';

export type HardwareDevicesListRowAddDeviceProps = {
  name?: string;
  deviceName?: string;
  onCancelAttachHandler?: () => void;
  onNameChange?: React.Dispatch<React.SetStateAction<string>>;
  onValidateName?: () => void;
  onResetValidateName?: () => void;
  onDeviceNameChange?: React.Dispatch<React.SetStateAction<string>>;
};

export const HardwareDevicesListRowAddDevice: React.FC<HardwareDevicesListRowAddDeviceProps> = ({
  name,
  deviceName,
  onCancelAttachHandler,
  onNameChange,
  onValidateName,
  onResetValidateName,
  onDeviceNameChange,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const { isBlur, isNameUsed, isNameEmpty } = React.useContext(HWContext);

  const [hc] = useHyperconvergedCR();
  const resourcesGroups = React.useMemo(() => {
    const pciHostDevs = hc?.spec?.permittedHostDevices?.pciHostDevices?.map(
      (dev) => dev?.resourceName,
    );
    const medDevs = hc?.spec?.permittedHostDevices?.mediatedDevices?.map(
      (dev) => dev?.resourceName,
    );

    let temp = [];
    if (!isEmpty(medDevs)) {
      temp = [
        { options: [...medDevs], label: t('kubevirt-plugin~Mediated devices'), key: 'mediated' },
      ];
    }

    if (!isEmpty(pciHostDevs)) {
      temp = isEmpty(temp)
        ? [
            {
              options: [...pciHostDevs],
              label: t('kubevirt-plugin~PCI Host devices'),
              key: 'pcihost',
            },
          ]
        : [
            ...temp,
            {
              options: [...pciHostDevs],
              label: t('kubevirt-plugin~PCI Host devices'),
              key: 'pcihost',
            },
          ];
    }

    return temp?.map((group) => (
      <SelectGroup label={group?.label} key={group?.key}>
        {group?.options?.map((option, index) => (
          <SelectOption key={index} value={option} />
        ))}
      </SelectGroup>
    ));
  }, [hc, t]);

  const onSelect = (e, devName: string) => {
    setIsOpen(false);
    onDeviceNameChange(devName);
  };

  return (
    <>
      <GridItem className="kv-hardware__row kv-hardware__name" span={5}>
        <TextInput
          isRequired
          value={name}
          autoFocus
          placeholder={t('kubevirt-plugin~Name')}
          onChange={onNameChange}
          onBlur={onValidateName}
          onFocus={onResetValidateName}
        />
      </GridItem>
      <GridItem className="kv-hardware__row kv-hardware__device" span={5}>
        <FilteredSelect
          placeholderText={t('kubevirt-plugin~Select Hardware device')}
          inlineFilterPlaceholderText={t('kubevirt-plugin~Filter by resource name..')}
          isGrouped
          onToggle={(expanded) => setIsOpen(expanded)}
          isOpen={isOpen}
          selections={deviceName}
          onSelect={onSelect}
        >
          {resourcesGroups}
        </FilteredSelect>
      </GridItem>
      <GridItem className="kv-hardware__row kv-hardware__remove-button" span={1}>
        <Button onClick={onCancelAttachHandler} variant="link">
          <MinusCircleIcon />
        </Button>
      </GridItem>
      {isBlur && isNameEmpty && (
        <HelperText>
          <HelperTextItem variant="error" hasIcon>
            {t('kubevirt-plugin~Name is Empty')}
          </HelperTextItem>
        </HelperText>
      )}
      {isBlur && isNameUsed && (
        <HelperText>
          <HelperTextItem variant="error" hasIcon>
            {t('kubevirt-plugin~Name is already taken by another device in this VM')}
          </HelperTextItem>
        </HelperText>
      )}
    </>
  );
};
