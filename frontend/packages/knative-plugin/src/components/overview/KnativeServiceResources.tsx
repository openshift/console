import * as React from 'react';
import * as _ from 'lodash';
import { podPhase } from '@console/internal/module/k8s';
import { BuildOverview } from '@console/internal/components/overview/build-overview';
import { PodModel } from '@console/internal/models';
import { AllPodStatus, OverviewItem, usePluginsOverviewTabSection } from '@console/shared';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';
import RevisionsOverviewList from './RevisionsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';

const REVISIONS_AUTOSCALED = 'All Revisions are autoscaled to 0';

type KnativeServiceResourceProps = {
  item: OverviewItem;
};

const KnativeServiceResources: React.FC<KnativeServiceResourceProps> = ({ item }) => {
  const { revisions, ksroutes, obj, pods, buildConfigs } = item;
  const {
    kind: resKind,
    metadata: { name, namespace },
  } = obj;
  const activePods = _.filter(pods, (pod) => podPhase(pod) !== AllPodStatus.AutoScaledTo0);
  const linkUrl = `/search/ns/${namespace}?kind=${PodModel.kind}&q=${encodeURIComponent(
    `serving.knative.dev/${resKind.toLowerCase()}=${name}`,
  )}`;
  const pluginComponents = usePluginsOverviewTabSection(item);
  return (
    <>
      <PodsOverview
        pods={activePods}
        obj={obj}
        emptyText={REVISIONS_AUTOSCALED}
        allPodsLink={linkUrl}
      />
      <RevisionsOverviewList revisions={revisions} service={obj} />
      <KSRoutesOverviewList ksroutes={ksroutes} resource={obj} />
      {buildConfigs.length > 0 && <BuildOverview buildConfigs={buildConfigs} />}
      {pluginComponents.map(({ Component, key }) => (
        <Component key={key} item={item} />
      ))}
    </>
  );
};

export default KnativeServiceResources;
