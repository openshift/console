import type { FC } from 'react';
import type { ConsolePluginKind } from '@openshift/api-types/dist/openshift/console.openshift.io/v1/ConsolePlugin';
import { Alert, List, ListItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

type ConsolePluginProxies = ConsolePluginKind['spec']['proxy'];

const hasUserTokenWarning = (proxies: ConsolePluginProxies) =>
  !proxies || proxies.some((proxy) => proxy.authorization === 'UserToken');

const ConsolePluginUserTokenWarningContent: FC<{ proxies?: ConsolePluginProxies }> = ({
  proxies,
}) => {
  const { t } = useTranslation('console-shared');
  const userTokenProxies = proxies?.filter((proxy) => proxy.authorization === 'UserToken') ?? [];
  return (
    <>
      <p>
        {proxies
          ? t(
              "This console plugin can send each logged in user's OAuth token to the services listed below. These services can use the token with that user's permissions. Requests can occur automatically when the console loads. Make sure you trust these services before enabling the plugin.",
            )
          : t(
              "The console plugin's proxy configuration is unavailable. If it declares a UserToken proxy, it can send each logged in user's OAuth token to that service. The service can use the token with that user's permissions. Requests can occur automatically when the console loads. Review the ConsolePlugin resource and make sure you trust its services before enabling the plugin.",
            )}
      </p>
      {userTokenProxies.length > 0 && (
        <List>
          {userTokenProxies.map(({ alias, endpoint }) => (
            <ListItem key={alias}>
              {alias}: {endpoint.service.namespace}/{endpoint.service.name}:{endpoint.service.port}
            </ListItem>
          ))}
        </List>
      )}
    </>
  );
};

export const ConsolePluginUserTokenWarning: FC<{ proxies?: ConsolePluginProxies }> = ({
  proxies,
}) => {
  const { t } = useTranslation('console-shared');
  return (
    hasUserTokenWarning(proxies) && (
      <Alert variant="warning" isInline title={t('User token access')}>
        <ConsolePluginUserTokenWarningContent proxies={proxies} />
      </Alert>
    )
  );
};

export const ConsolePluginWarning: FC<ConsolePluginWarningProps> = ({
  enabled,
  previouslyEnabled,
  trusted,
  proxies,
}) => {
  const { t } = useTranslation('console-shared');
  return (
    !previouslyEnabled &&
    enabled &&
    (!trusted || hasUserTokenWarning(proxies)) && (
      <Alert variant="warning" isInline title={t('Enabling console plugin')}>
        {!trusted && (
          <p>
            {t(
              'This console plugin will be able to provide a custom interface and run any Kubernetes command as the logged in user. Make sure you trust it before enabling.',
            )}
          </p>
        )}
        {hasUserTokenWarning(proxies) && <ConsolePluginUserTokenWarningContent proxies={proxies} />}
      </Alert>
    )
  );
};

type ConsolePluginWarningProps = {
  enabled: boolean;
  previouslyEnabled: boolean;
  trusted: boolean;
  // Undefined means the configuration is unavailable; an empty list means no proxies.
  proxies?: ConsolePluginProxies;
};
