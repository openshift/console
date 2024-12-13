import * as React from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  PREFERRED_TELEMETRY_USER_SETTING_KEY,
  USER_TELEMETRY_ANALYTICS,
  useTelemetry,
  useUserSettings,
} from '@console/shared';

type TelemetryAnalyticsSelectOptions = {
  value: USER_TELEMETRY_ANALYTICS;
  title: string;
  description: string;
  isSelected: boolean;
};

const TelemetryAnalyticsSelect: React.FC<{
  disabled: boolean;
  value?: string;
  onChange: (selectedOption: TelemetryAnalyticsSelectOptions) => void;
}> = ({ disabled, value, onChange }) => {
  const { t } = useTranslation();
  const options: TelemetryAnalyticsSelectOptions[] = [
    {
      value: USER_TELEMETRY_ANALYTICS.ALLOW,
      title: t('console-telemetry-plugin~Accept'),
      description: t('console-telemetry-plugin~Send telemetry events.'),
      isSelected: value === USER_TELEMETRY_ANALYTICS.ALLOW,
    },
    {
      value: USER_TELEMETRY_ANALYTICS.DENY,
      title: t('console-telemetry-plugin~Deny'),
      description: t('console-telemetry-plugin~Do not send telemetry events.'),
      isSelected: value === USER_TELEMETRY_ANALYTICS.DENY,
    },
  ];
  const [isOpen, setIsOpen] = React.useState(false);
  const selection = options.find((option) => option.isSelected)?.value;

  const toggle = (toggleRef: React.RefObject<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsOpen(!isOpen)}
      isDisabled={disabled}
      isFullWidth
      id="telemetry"
    >
      {selection
        ? options.find((option) => option.value === selection)?.title
        : t('console-telemetry-plugin~Select option')}
    </MenuToggle>
  );

  return (
    <Select
      toggle={toggle}
      isOpen={isOpen}
      toggleId="telemetry"
      onSelect={(_, selectedValue?: TelemetryAnalyticsSelectOptions) => {
        if (selectedValue) {
          onChange(selectedValue);
        }
        setIsOpen(false);
      }}
      aria-label={t('console-telemetry-plugin~Select option')}
      maxHeight={300}
      onOpenChange={(open) => setIsOpen(open)}
    >
      <SelectList>
        {options.map((option) => (
          <SelectOption
            key={option.value}
            value={option}
            description={option.description}
            isSelected={option.isSelected}
          >
            {option.title}
          </SelectOption>
        ))}
      </SelectList>
    </Select>
  );
};

const TelemetryUserPreferenceDropdown: React.FC = () => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();

  const [
    currentUserPreferenceTelemetryValue,
    setCurrentUserPreferenceTelemetryValue,
  ] = useUserSettings<USER_TELEMETRY_ANALYTICS>(PREFERRED_TELEMETRY_USER_SETTING_KEY, null, true);

  const onChange = (selectedOption: TelemetryAnalyticsSelectOptions) => {
    fireTelemetryEvent('Telemetry user preference changes', {
      customize: 'User preference - Telemetry',
      analytics: selectedOption.value,
    });
    setCurrentUserPreferenceTelemetryValue(selectedOption.value);
  };

  return (
    <div className="pf-v6-c-form">
      <FormGroup fieldId="telemetry" label={t('console-telemetry-plugin~Telemetry')}>
        <TelemetryAnalyticsSelect
          disabled={!window.SERVER_FLAGS.telemetry?.STATE}
          value={currentUserPreferenceTelemetryValue}
          onChange={onChange}
        />
        <FormHelperText>
          <HelperText>
            <HelperTextItem>
              {t(
                'console-telemetry-plugin~Select a option whether to send telemetry events or not.',
              )}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
    </div>
  );
};

export default TelemetryUserPreferenceDropdown;
