import * as React from 'react';
import { Button, GridItem, HelperText, HelperTextItem, TextInput } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import HardwareDevicesSelect from './HardwareDevicesSelect';

export type HardwareDevicesListRowProps = {
  isDisabled?: boolean;
  name: string;
  setName?: React.Dispatch<React.SetStateAction<string>>;
  deviceName: string;
  setDeviceName?: React.Dispatch<React.SetStateAction<string>>;
  onDetachDevice?: () => void;
  onCancelAttach?: () => void;
  isAttachDevice?: boolean;
  setIsAttachDevice?: React.Dispatch<React.SetStateAction<boolean>>;
  setIsBlur?: React.Dispatch<React.SetStateAction<boolean>>;
  onDetachHandler?: (string) => void;
  isBlur?: boolean;
  isNameUsed?: boolean;
  isNameEmpty?: boolean;
};

const HardwareDevicesListRow: React.FC<HardwareDevicesListRowProps> = ({
  isAttachDevice,
  name,
  setName,
  deviceName,
  setDeviceName,
  isDisabled,
  setIsAttachDevice,
  setIsBlur,
  onDetachHandler,
  isBlur,
  isNameUsed,
  isNameEmpty,
}) => {
  const { t } = useTranslation();

  const onClick = () => {
    if (!isDisabled) {
      setIsAttachDevice(false);
    } else {
      onDetachHandler(name);
    }
  };
  return (
    <>
      <GridItem span={5}>
        <TextInput
          className="kv-label__key"
          placeholder={t('kubevirt-plugin~Name')}
          isRequired
          isDisabled={isDisabled}
          type="text"
          value={name}
          onChange={setName}
          aria-label={t('kubevirt-plugin~Name')}
          autoFocus={!isDisabled}
          onBlur={() => setIsBlur(true)}
          onFocus={() => setIsBlur(false)}
        />
      </GridItem>
      <GridItem span={6}>
        {isAttachDevice ? (
          <HardwareDevicesSelect selected={deviceName} setSelected={setDeviceName} />
        ) : (
          <TextInput
            className="kv-label__value"
            placeholder={t('kubevirt-plugin~Device name')}
            isRequired
            isDisabled={isDisabled}
            type="text"
            value={deviceName}
            aria-label={t('kubevirt-plugin~Device name')}
          />
        )}
      </GridItem>
      <GridItem span={1}>
        <Button onClick={onClick} variant="link">
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

export default HardwareDevicesListRow;
