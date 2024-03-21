import * as React from 'react';
import { FormHelperText, FormSection } from '@patternfly/react-core';
import {
  Select as SelectDeprecated,
  SelectOption as SelectOptionDeprecated,
} from '@patternfly/react-core/deprecated';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { CLUSTER_TELEMETRY_ANALYTICS, useTelemetry } from '@console/shared/src';
import {
  useDebounceCallback,
  useConsoleOperatorConfig,
  patchConsoleOperatorConfig,
  FormLayout,
  LoadError,
  SaveStatus,
  SaveStatusProps,
} from '@console/shared/src/components/cluster-configuration';

type TelemetryConsoleConfig = K8sResourceKind & {
  metadata: {
    annotations?: {
      'telemetry.console.openshift.io/STATE': CLUSTER_TELEMETRY_ANALYTICS;
    };
  };
};

type TelemetryAnalyticsSelectOptions = {
  value: CLUSTER_TELEMETRY_ANALYTICS;
  title: string;
  description: string;
  isSelected: boolean;
};

const TelemetryAnalyticsSelect: React.FC<{
  disabled: boolean;
  value?: CLUSTER_TELEMETRY_ANALYTICS;
  onChange: (selectedOption: TelemetryAnalyticsSelectOptions) => void;
}> = ({ disabled, value, onChange }) => {
  const { t } = useTranslation();
  const options: TelemetryAnalyticsSelectOptions[] = [
    {
      value: CLUSTER_TELEMETRY_ANALYTICS.OPTIN,
      title: t('console-telemetry-plugin~Opt-in'),
      description: t('console-telemetry-plugin~Opt-in to send telemetry events.'),
      isSelected: value === CLUSTER_TELEMETRY_ANALYTICS.OPTIN,
    },
    {
      value: CLUSTER_TELEMETRY_ANALYTICS.OPTOUT,
      title: t('console-telemetry-plugin~Opt-out'),
      description: t('console-telemetry-plugin~Opt-out to send telemetry events.'),
      isSelected: value === CLUSTER_TELEMETRY_ANALYTICS.OPTOUT,
    },
    {
      value: CLUSTER_TELEMETRY_ANALYTICS.ENFORCE,
      title: t('console-telemetry-plugin~Enforce'),
      description: t('console-telemetry-plugin~Always send telemetry events.'),
      isSelected: value === CLUSTER_TELEMETRY_ANALYTICS.ENFORCE,
    },
    {
      value: CLUSTER_TELEMETRY_ANALYTICS.DISABLED,
      title: t('console-telemetry-plugin~Disabled'),
      description: t('console-telemetry-plugin~Disable the telemetry in the cluster.'),
      isSelected: value === CLUSTER_TELEMETRY_ANALYTICS.DISABLED,
    },
  ];

  const [isOpen, setIsOpen] = React.useState(false);
  const selection = options.find((option) => option.isSelected)?.value;
  return (
    <div data-test="telemetry-dropdown">
      <SelectDeprecated
        disabled={disabled}
        isOpen={isOpen}
        selections={selection}
        onToggle={(_event, isExpanded) => setIsOpen(isExpanded)}
        onSelect={() => setIsOpen(false)}
        placeholderText={t('console-telemetry-plugin~Select option')}
      >
        {options.map((option) => (
          <SelectOptionDeprecated
            key={option.value}
            value={option.value}
            description={option.description}
            onClick={() => onChange(option)}
            data-test={`telemetry-dropdown-option-${option.title}`}
          >
            {option.title}
          </SelectOptionDeprecated>
        ))}
      </SelectDeprecated>
    </div>
  );
};

const TelemetryConfiguration: React.FC<{ readonly: boolean }> = ({ readonly }) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();

  // Current configuration
  const [consoleConfig, consoleConfigLoaded, consoleConfigError] = useConsoleOperatorConfig<
    TelemetryConsoleConfig
  >();
  const [configuredTelemetrySetting, setConfiguredTelemetrySetting] = React.useState<
    CLUSTER_TELEMETRY_ANALYTICS
  >();
  React.useEffect(() => {
    if (consoleConfig && consoleConfigLoaded && !configuredTelemetrySetting) {
      setConfiguredTelemetrySetting(
        consoleConfig?.metadata?.annotations?.['telemetry.console.openshift.io/STATE'],
      );
    }
  }, [configuredTelemetrySetting, consoleConfig, consoleConfigLoaded]);

  // Save the latest changes
  const [saveStatus, setSaveStatus] = React.useState<SaveStatusProps>();
  const save = useDebounceCallback(() => {
    setSaveStatus({ status: 'in-progress' });

    const patch = {
      metadata: {
        annotations: {
          'telemetry.console.openshift.io/STATE': configuredTelemetrySetting,
        },
      },
    };
    patchConsoleOperatorConfig(patch)
      .then(() => setSaveStatus({ status: 'successful' }))
      .catch((error) => setSaveStatus({ status: 'error', error }));
  }, 2000);

  const disabled = readonly || !consoleConfigLoaded || !!consoleConfigError;

  const onChange = (selectedOption: TelemetryAnalyticsSelectOptions) => {
    fireTelemetryEvent('Console cluster configuration changed', {
      customize: 'Telemetry',
      analytics: selectedOption.value,
    });
    setConfiguredTelemetrySetting(selectedOption.value);
    save();
  };

  return (
    <FormLayout isHorizontal>
      <FormSection
        title={t('console-telemetry-plugin~Analytics')}
        data-test="telemetry form-section"
      >
        <FormHelperText>
          {t(
            'console-telemetry-plugin~As admin you can decide sending telemetry events to a pre-configured Red Hat proxy that can be forwarded to third-party services for analysis.',
          )}
        </FormHelperText>
        <TelemetryAnalyticsSelect
          disabled={disabled}
          value={configuredTelemetrySetting}
          onChange={onChange}
        />
        <LoadError error={consoleConfigError} />
        <SaveStatus {...saveStatus} />
      </FormSection>
    </FormLayout>
  );
};

export default TelemetryConfiguration;
