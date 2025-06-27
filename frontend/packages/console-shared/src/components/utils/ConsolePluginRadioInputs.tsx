import * as React from 'react';
import { Radio } from '@patternfly/react-core';
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
    <>
      <Radio
        id={`${name}-enabled`}
        name={name}
        onChange={onChange}
        value="enabled"
        isChecked={enabled}
        label={t('console-shared~Enable')}
        autoFocus={autofocus && enabled}
        data-test="Enable-radio-input"
      />
      <Radio
        id={`${name}-disabled`}
        name={name}
        onChange={onChange}
        value="disabled"
        isChecked={!enabled}
        label={t('console-shared~Disable')}
        autoFocus={autofocus && !enabled}
        data-test="Disable-radio-input"
      />
    </>
  );
};

type ConsolePluginRadioInputsProps = {
  autofocus?: boolean;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  name: string;
};

export default ConsolePluginRadioInputs;
