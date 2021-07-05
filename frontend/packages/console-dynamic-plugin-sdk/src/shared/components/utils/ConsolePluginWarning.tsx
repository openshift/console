import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

const ConsolePluginWarning: React.FC<ConsolePluginWarningProps> = ({
  enabled,
  previouslyEnabled,
  trusted,
}) => {
  const { t } = useTranslation();
  return (
    !previouslyEnabled &&
    enabled &&
    !trusted && (
      <Alert
        variant="warning"
        isInline
        title={t('console-dynamic-plugin-sdk~Enabling console plugin')}
      >
        <p>
          {t(
            'console-dynamic-plugin-sdk~This console plugin will be able to provide a custom interface and run any Kubernetes command as the logged in user. Make sure you trust it before enabling.',
          )}
        </p>
      </Alert>
    )
  );
};

type ConsolePluginWarningProps = {
  enabled: boolean;
  previouslyEnabled: boolean;
  trusted: boolean;
};

export default ConsolePluginWarning;
