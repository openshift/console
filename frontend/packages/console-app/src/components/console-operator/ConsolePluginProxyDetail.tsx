import type { FC } from 'react';
import { List, ListItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { DetailsItemComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { ServiceModel } from '@console/internal/models';
import type { ConsolePluginKind } from '@console/internal/module/k8s';
import { ConsolePluginUserTokenWarning } from '@console/shared/src/components/utils/ConsolePluginWarning';
import { DASH } from '@console/shared/src/constants/ui';

const ConsolePluginBackendDetail: FC<ConsolePluginBackendDetailProps> = ({
  obj: {
    spec: { proxy },
  },
}) => {
  const { t } = useTranslation('console-app');
  return proxy && proxy.length > 0 ? (
    <>
      <List isPlain>
        {proxy.map(
          (p) =>
            // only Service is supported per the ConsolePlugin schema
            p.endpoint.type === ServiceModel.label && (
              <ListItem key={p.alias}>
                {p.alias}:{' '}
                <ResourceLink
                  name={p.endpoint.service.name}
                  namespace={p.endpoint.service.namespace}
                  groupVersionKind={getGroupVersionKindForModel(ServiceModel)}
                />{' '}
                {t('Authorization: {{authorization}}', {
                  authorization: p.authorization ?? 'None',
                })}
              </ListItem>
            ),
        )}
      </List>
      <ConsolePluginUserTokenWarning proxies={proxy} />
    </>
  ) : (
    <>{DASH}</>
  );
};

type ConsolePluginBackendDetailProps = Omit<DetailsItemComponentProps, 'obj'> & {
  obj: ConsolePluginKind;
};

export default ConsolePluginBackendDetail;
