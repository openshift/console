import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  ResourceLink,
  ExternalLink,
  SidebarSectionHeading,
} from '@console/internal/components/utils';
import {
  K8sResourceKind,
  referenceForGroupVersionKind,
  groupVersionFor,
} from '@console/internal/module/k8s';
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

export const EventSourceTarget: React.FC<EventSourceTargetProps> = ({ obj }) => {
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
        <ul className="list-group">
          <li className="list-group-item">
            {isSinkReference && (
              <ResourceLink
                kind={referenceForGroupVersionKind(group)(version)(sinkKind)}
                name={sinkName}
                namespace={namespace}
              />
            )}
            {sinkUri && (
              <>
                <span className="text-muted">{t('knative-plugin~Target URI:')} </span>
                <ExternalLink
                  href={sinkUri}
                  additionalClassName="co-external-link--block"
                  text={sinkUri}
                />
              </>
            )}
          </li>
        </ul>
      ) : (
        <span className="text-muted">{t('knative-plugin~No sink found for this resource.')}</span>
      )}
    </>
  );
};

export const EventSourceDeployments: React.FC<EventSourceDeploymentsProps> = ({
  deploymentObj,
}) => {
  const { t } = useTranslation();
  return (
    <>
      {!_.isEmpty(deploymentObj) ? (
        <>
          <SidebarSectionHeading text={t('knative-plugin~Deployment')} />
          <ul className="list-group">
            <li className="list-group-item">
              <ResourceLink
                kind={deploymentObj.kind}
                name={deploymentObj.metadata.name}
                namespace={deploymentObj.metadata.namespace}
              />
            </li>
          </ul>
        </>
      ) : null}
    </>
  );
};

export const OwnedEventSources: React.FC<OwnedEventSourcesProps> = ({ eventSources }) => (
  <>
    {eventSources?.length > 0
      ? eventSources.map((source) => (
          <EventSourceOwnedList key={source.metadata.uid} source={source} />
        ))
      : null}
  </>
);
