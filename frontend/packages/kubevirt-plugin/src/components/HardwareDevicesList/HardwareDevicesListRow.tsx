import * as React from 'react';
import {
  Button,
  GridItem,
  HelperText,
  HelperTextItem,
  SelectProps,
  TextInput,
  TextInputProps,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import FilteredSelect from '../FilteredSelect/FilteredSelect';

export type HardwareDevicesListRowProps = {
  name?: string;
  deviceName?: string;
  isAttachDevice?: boolean;
  onClick?: (id?: any) => void;
  isBlur?: boolean;
  isNameUsed?: boolean;
  isNameEmpty?: boolean;
  textProps?: TextInputProps;
  selectProps?: SelectProps;
};

export const HardwareDevicesListRow: React.FC<HardwareDevicesListRowProps> = ({
  isAttachDevice,
  name,
  deviceName,
  onClick,
  isBlur,
  isNameUsed,
  isNameEmpty,
  textProps,
  selectProps,
}) => {
  const { t } = useTranslation();
  const { isReadOnly } = textProps;
  const { children } = !isEmpty(selectProps) && selectProps;

  let deviceNameInput = <TextInput className="kv-label__value" isReadOnly value={deviceName} />;

  if (isAttachDevice) {
    deviceNameInput = <FilteredSelect {...selectProps}>{children}</FilteredSelect>;
  }

  return (
    <>
      <GridItem span={5}>
        <TextInput
          className="kv-label__key"
          isRequired
          value={name}
          autoFocus={!isReadOnly}
          {...textProps}
        />
      </GridItem>
      <GridItem span={6}>{deviceNameInput}</GridItem>
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
