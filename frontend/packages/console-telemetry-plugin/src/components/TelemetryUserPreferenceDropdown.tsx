import * as React from 'react';
import { FormGroup, FormHelperText, HelperText, HelperTextItem } from '@patternfly/react-core';
import {
  Select as SelectDeprecated,
  SelectOption as SelectOptionDeprecated,
  SelectVariant as SelectVariantDeprecated,
} from '@patternfly/react-core/deprecated';
import { useTranslation } from 'react-i18next';
import {
  CLUSTER_TELEMETRY_ANALYTICS,
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
  return (
    <>
      <SelectDeprecated
        id="telemetry"
        variant={SelectVariantDeprecated.single}
        isOpen={isOpen}
        selections={selection}
        toggleId="telemetry"
        onToggle={(_event, isExpanded) => setIsOpen(isExpanded)}
        onSelect={() => setIsOpen(false)}
        placeholderText={t('console-telemetry-plugin~Select option')}
        isDisabled={disabled}
        aria-label={t('console-telemetry-plugin~Select option')}
        maxHeight={300}
      >
        {options.map((option) => (
          <SelectOptionDeprecated
            key={option.value}
            value={option.value}
            description={option.description}
            onClick={() => onChange(option)}
          >
            {option.title}
          </SelectOptionDeprecated>
        ))}
      </SelectDeprecated>
    </>
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
    <div className="pf-v5-c-form">
      {(window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.OPTIN ||
        window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.OPTOUT) && (
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
      )}
    </div>
  );
};

export default TelemetryUserPreferenceDropdown;
