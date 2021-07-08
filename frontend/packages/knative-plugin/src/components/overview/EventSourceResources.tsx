import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';
import {
  ResourceLink,
  ExternalLink,
  SidebarSectionHeading,
} from '@console/internal/components/utils';
import { PodModel } from '@console/internal/models';
import {
  K8sResourceKind,
  referenceForGroupVersionKind,
  groupVersionFor,
} from '@console/internal/module/k8s';
import { usePodsWatcher } from '@console/shared';
import EventSourceOwnedList from './EventSourceOwnedList';

type EventSourceResourcesProps = {
  obj: K8sResourceKind;
  ownedSources?: K8sResourceKind[];
};

const EventSourceResources: React.FC<EventSourceResourcesProps> = ({ obj, ownedSources }) => {
  const { t } = useTranslation();
  const {
    kind,
    apiVersion,
    metadata: { name, namespace },
    spec,
    status,
  } = obj;
  const { name: sinkName, kind: sinkKind, apiVersion: sinkApiversion } =
    spec?.sink?.ref || spec?.sink || {};
  const sinkUri = spec?.sink?.uri || status?.sinkUri;
  const apiGroup = apiVersion.split('/')[0];
  const linkUrl = `/search/ns/${namespace}?kind=${PodModel.kind}&q=${encodeURIComponent(
    `${apiGroup}/${_.lowerFirst(kind)}=${name}`,
  )}`;
  const { group, version } = (sinkApiversion && groupVersionFor(sinkApiversion)) || {};
  const isSinkReference = !!(sinkKind && sinkName && group && version);
  const { podData } = usePodsWatcher(obj, obj.kind, namespace);
  const deploymentData = podData?.current?.obj?.metadata?.ownerReferences?.[0];

  return (
    <>
      <SidebarSectionHeading text={t('knative-plugin~Sink')} />
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
                <span className="text-muted">{t('knative-plugin~Sink URI:')} </span>
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
      {podData?.pods?.length > 0 && <PodsOverview obj={obj} allPodsLink={linkUrl} />}
      {deploymentData?.name && (
        <>
          <SidebarSectionHeading text={t('knative-plugin~Deployment')} />
          <ul className="list-group">
            <li className="list-group-item">
              <ResourceLink
                kind={deploymentData.kind}
                name={deploymentData.name}
                namespace={namespace}
              />
            </li>
          </ul>
        </>
      )}
      {ownedSources?.length > 0 &&
        ownedSources.map((source) => (
          <EventSourceOwnedList key={source.metadata.uid} source={source} />
        ))}
    </>
  );
};

export default EventSourceResources;
