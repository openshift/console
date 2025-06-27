import * as React from 'react';
import { FormGroup, Radio } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

const ConsolePluginRadioInputs: React.FC<ConsolePluginRadioInputsProps> = ({
  autofocus,
  enabled,
  onChange: setEnabled,
  name,
}) => {
  const { t } = useTranslation();
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEnabled(e.currentTarget.value === 'enabled');
  return (
    <FormGroup isStack>
      <Radio
        id={`${name}-enabled`}
        name={name}
        value="enabled"
        label={t('console-shared~Enable')}
        onChange={onChange}
        isChecked={enabled}
        data-checked-state={enabled}
        autoFocus={autofocus && enabled}
        data-test="Enable-radio-input"
      />
      <Radio
        id={`${name}-disabled`}
        name={name}
        value="disabled"
        label={t('console-shared~Disable')}
        onChange={onChange}
        isChecked={!enabled}
        data-checked-state={!enabled}
        autoFocus={autofocus && !enabled}
        data-test="Disable-radio-input"
      />
    </FormGroup>
  );
};

type ConsolePluginRadioInputsProps = {
  autofocus?: boolean;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  name: string;
};

export default ConsolePluginRadioInputs;
