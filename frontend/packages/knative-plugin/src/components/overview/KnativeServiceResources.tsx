import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { podPhase } from '@console/internal/module/k8s';
import { BuildOverview } from '@console/internal/components/overview/build-overview';
import { PodModel } from '@console/internal/models';
import {
  AllPodStatus,
  OverviewItem,
  usePluginsOverviewTabSection,
  useBuildConfigsWatcher,
} from '@console/shared';
import { PodsOverviewContent } from '@console/internal/components/overview/pods-overview';
import { Subscriber } from '../../topology/topology-types';
import { getSubscriberByType } from '../../topology/knative-topology-utils';
import RevisionsOverviewList from './RevisionsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';
import { PubSubResourceOverviewList } from './EventPubSubResources';
import PubSubSubscribers from './EventPubSubSubscribers';

const REVISIONS_AUTOSCALED = 'All Revisions are autoscaled to 0';

type KnativeServiceResourceProps = {
  item: OverviewItem & {
    subscribers?: Subscriber[];
  };
};

const KnativeServiceResources: React.FC<KnativeServiceResourceProps> = ({ item }) => {
  const { t } = useTranslation();
  const { revisions, ksroutes, obj, pods, eventSources = [], subscribers = [] } = item;
  const { buildConfigs } = useBuildConfigsWatcher(obj);
  const {
    kind: resKind,
    metadata: { name, namespace },
  } = obj;
  const activePods = _.filter(pods, (pod) => podPhase(pod) !== AllPodStatus.AutoScaledTo0);
  const linkUrl = `/search/ns/${namespace}?kind=${PodModel.kind}&q=${encodeURIComponent(
    `serving.knative.dev/${resKind.toLowerCase()}=${name}`,
  )}`;
  const [channels, brokers] = getSubscriberByType(subscribers);
  const pluginComponents = usePluginsOverviewTabSection(item);
  return (
    <>
      <PodsOverviewContent
        pods={activePods}
        obj={obj}
        loaded
        loadError={null}
        emptyText={REVISIONS_AUTOSCALED}
        allPodsLink={linkUrl}
      />
      <RevisionsOverviewList revisions={revisions} service={obj} />
      <KSRoutesOverviewList ksroutes={ksroutes} resource={obj} />
      {buildConfigs.length > 0 && <BuildOverview buildConfigs={buildConfigs} />}
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
