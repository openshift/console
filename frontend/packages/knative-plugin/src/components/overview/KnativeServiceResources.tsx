import * as React from 'react';
import { PodKind, podPhase } from '@console/internal/module/k8s';
import { BuildOverview } from '@console/internal/components/overview/build-overview';
import { PodModel } from '@console/internal/models';
import { AllPodStatus, usePluginsOverviewTabSection, useDeepCompareMemoize } from '@console/shared';
import { PodsOverviewContent } from '@console/internal/components/overview/pods-overview';
import { usePodsForRevisions } from '../../utils/usePodsForRevisions';
import { KnativeServiceOverviewItem } from '../../topology/topology-types';
import { getSubscriberByType } from '../../topology/knative-topology-utils';
import RevisionsOverviewList from './RevisionsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';
import { PubSubResourceOverviewList } from './EventPubSubResources';
import PubSubSubscribers from './EventPubSubSubscribers';

const REVISIONS_AUTOSCALED = 'All Revisions are autoscaled to 0';

type KnativeServiceResourceProps = {
  item: KnativeServiceOverviewItem;
};

const KnativeServiceResources: React.FC<KnativeServiceResourceProps> = ({ item }) => {
  const { revisions, ksroutes, obj, buildConfigs, eventSources = [], subscribers = [] } = item;
  const {
    kind: resKind,
    metadata: { name, namespace },
  } = obj;
  const linkUrl = `/search/ns/${namespace}?kind=${PodModel.kind}&q=${encodeURIComponent(
    `serving.knative.dev/${resKind.toLowerCase()}=${name}`,
  )}`;
  const [channels, brokers] = getSubscriberByType(subscribers);
  const pluginComponents = usePluginsOverviewTabSection(item);
  const revisionIds = useDeepCompareMemoize(
    revisions.map((r) => r.metadata.uid).sort((a, b) => a.localeCompare(b)),
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const revisionResources = React.useMemo(() => [...revisions], [revisionIds]);
  const { pods, loaded, loadError } = usePodsForRevisions(revisionResources, namespace);
  const [servicePods, setServicePods] = React.useState<PodKind[]>([]);
  React.useEffect(() => {
    if (loaded) {
      const revisionsPods = [];
      pods.forEach((pod) => {
        if (pod.pods) {
          revisionsPods.push(
            ...pod.pods.filter((p) => podPhase(p as PodKind) !== AllPodStatus.AutoScaledTo0),
          );
        }
      });
      setServicePods(revisionsPods);
    }
  }, [loaded, pods]);

  return (
    <>
      <PodsOverviewContent
        obj={obj}
        pods={servicePods}
        loaded={loaded}
        loadError={loadError}
        emptyText={REVISIONS_AUTOSCALED}
        allPodsLink={linkUrl}
      />
      <RevisionsOverviewList revisions={revisions} service={obj} />
      <KSRoutesOverviewList ksroutes={ksroutes} resource={obj} />
      {buildConfigs.length > 0 && <BuildOverview buildConfigs={buildConfigs} />}
      {eventSources.length > 0 && (
        <PubSubResourceOverviewList items={eventSources} title="Event Sources" />
      )}
      {channels.length > 0 && <PubSubSubscribers subscribers={channels} title="Subscriptions" />}
      {brokers.length > 0 && <PubSubSubscribers subscribers={brokers} title="Triggers" />}
      {pluginComponents.map(({ Component, key }) => (
        <Component key={key} item={item} />
      ))}
    </>
  );
};

export default KnativeServiceResources;
