import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { BuildOverview } from '@console/internal/components/overview/build-overview';
import { PodsOverviewContent } from '@console/internal/components/overview/pods-overview';
import { PodModel } from '@console/internal/models';
import { PodKind, podPhase } from '@console/internal/module/k8s';
import {
  AllPodStatus,
  usePluginsOverviewTabSection,
  useBuildConfigsWatcher,
} from '@console/shared';
import { getSubscriberByType } from '../../topology/knative-topology-utils';
import { KnativeServiceOverviewItem } from '../../topology/topology-types';
import { usePodsForRevisions } from '../../utils/usePodsForRevisions';
import { PubSubResourceOverviewList } from './EventPubSubResources';
import PubSubSubscribers from './EventPubSubSubscribers';
import RevisionsOverviewList from './RevisionsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';

type KnativeServiceResourceProps = {
  item: KnativeServiceOverviewItem;
};

const KnativeServiceResources: React.FC<KnativeServiceResourceProps> = ({ item }) => {
  const { t } = useTranslation();
  const { revisions, ksroutes, obj, eventSources = [], subscribers = [] } = item;
  const { buildConfigs = [] } = useBuildConfigsWatcher(obj);
  const {
    kind: resKind,
    metadata: { name, namespace },
  } = obj;
  const linkUrl = `/search/ns/${namespace}?kind=${PodModel.kind}&q=${encodeURIComponent(
    `serving.knative.dev/${resKind.toLowerCase()}=${name}`,
  )}`;
  const [channels, brokers] = getSubscriberByType(subscribers);
  const pluginComponents = usePluginsOverviewTabSection(item);
  const revisionIds = revisions?.map((r) => r.metadata.uid).sort((a, b) => a.localeCompare(b));
  const { pods, loaded, loadError } = usePodsForRevisions(revisionIds, namespace);
  const servicePods = React.useMemo(() => {
    if (loaded && !loadError) {
      return pods.reduce((acc, pod) => {
        if (pod.pods) {
          acc.push(
            ...pod.pods.filter((p) => podPhase(p as PodKind) !== AllPodStatus.AutoScaledTo0),
          );
        }
        return acc;
      }, []);
    }
    return [];
  }, [loadError, loaded, pods]);

  return (
    <>
      <PodsOverviewContent
        obj={obj}
        pods={servicePods}
        loaded={loaded}
        loadError={loadError}
        emptyText={t('knative-plugin~All Revisions are autoscaled to 0')}
        allPodsLink={linkUrl}
      />
      <RevisionsOverviewList revisions={revisions} service={obj} />
      <KSRoutesOverviewList ksroutes={ksroutes} resource={obj} />
      {buildConfigs?.length > 0 && <BuildOverview buildConfigs={buildConfigs} />}
      {eventSources.length > 0 && (
        <PubSubResourceOverviewList
          items={eventSources}
          title={t('knative-plugin~Event Sources')}
        />
      )}
      {channels.length > 0 && (
        <PubSubSubscribers subscribers={channels} title={t('knative-plugin~Subscriptions')} />
      )}
      {brokers.length > 0 && (
        <PubSubSubscribers subscribers={brokers} title={t('knative-plugin~Triggers')} />
      )}
      {pluginComponents.map(({ Component, key }) => (
        <Component key={key} item={item} />
      ))}
    </>
  );
};

export default KnativeServiceResources;
