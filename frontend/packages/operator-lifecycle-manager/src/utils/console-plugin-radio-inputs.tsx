import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RadioInput } from '@console/internal/components/radio';

export const ConsolePluginRadioInputs: React.FC<ConsolePluginRadioInputsProps> = ({
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
      <RadioInput
        name={name}
        onChange={onChange}
        value="enabled"
        checked={enabled}
        title={t('olm~Enable')}
        autoFocus={autofocus && enabled}
      />
      <RadioInput
        name={name}
        onChange={onChange}
        value="disabled"
        checked={!enabled}
        title={t('olm~Disable')}
        autoFocus={autofocus && !enabled}
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
