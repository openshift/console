import type { FC } from 'react';
import { List, ListItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForGroupVersionKind, groupVersionFor } from '@console/internal/module/k8s';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import EventSourceOwnedList from './EventSourceOwnedList';

type EventSourceTargetProps = {
  obj: K8sResourceKind;
};

type EventSourceDeploymentsProps = {
  deploymentObj: K8sResourceKind;
};

type OwnedEventSourcesProps = {
  eventSources: K8sResourceKind[];
};

export const EventSourceTarget: FC<EventSourceTargetProps> = ({ obj }) => {
  const { t } = useTranslation();
  const {
    metadata: { namespace },
    spec,
    status,
  } = obj;
  const { name: sinkName, kind: sinkKind, apiVersion: sinkApiversion } =
    spec?.sink?.ref || spec?.sink || {};
  const sinkUri = spec?.sink?.uri || status?.sinkUri;
  const { group, version } = (sinkApiversion && groupVersionFor(sinkApiversion)) || {};
  const isSinkReference = !!(sinkKind && sinkName && group && version);

  return (
    <>
      <SidebarSectionHeading text={t('knative-plugin~Target')} />
      {isSinkReference || sinkUri ? (
        <List isPlain isBordered>
          <ListItem>
            {isSinkReference && (
              <ResourceLink
                kind={referenceForGroupVersionKind(group)(version)(sinkKind)}
                name={sinkName}
                namespace={namespace}
              />
            )}
            {sinkUri && (
              <>
                <span className="pf-v6-u-text-color-subtle">
                  {t('knative-plugin~Target URI:')}{' '}
                </span>
                <ExternalLink href={sinkUri} displayBlock text={sinkUri} />
              </>
            )}
          </ListItem>
        </List>
      ) : (
        <span className="pf-v6-u-text-color-subtle">
          {t('knative-plugin~No sink found for this resource.')}
        </span>
      )}
    </>
  );
};

export const EventSourceDeployments: FC<EventSourceDeploymentsProps> = ({ deploymentObj }) => {
  const { t } = useTranslation();
  return (
    <>
      {!_.isEmpty(deploymentObj) ? (
        <>
          <SidebarSectionHeading text={t('knative-plugin~Deployment')} />
          <List isPlain isBordered>
            <ListItem>
              <ResourceLink
                kind={deploymentObj.kind}
                name={deploymentObj.metadata.name}
                namespace={deploymentObj.metadata.namespace}
              />
            </ListItem>
          </List>
        </>
      ) : null}
    </>
  );
};

export const OwnedEventSources: FC<OwnedEventSourcesProps> = ({ eventSources }) => (
  <>
    {eventSources?.length > 0
      ? eventSources.map((source) => (
          <EventSourceOwnedList key={source.metadata.uid} source={source} />
        ))
      : null}
  </>
);
