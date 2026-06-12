import type { FC } from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const ConsolePluginWarning: FC<ConsolePluginWarningProps> = ({
  enabled,
  previouslyEnabled,
  trusted,
}) => {
  const { t } = useTranslation('console-shared');
  return (
    !previouslyEnabled &&
    enabled &&
    !trusted && (
      <Alert variant="warning" isInline title={t('Enabling console plugin')}>
        <p>
          {t(
            'console-shared~This console plugin will be able to provide a custom interface and run any Kubernetes command as the logged in user. Make sure you trust it before enabling.',
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
