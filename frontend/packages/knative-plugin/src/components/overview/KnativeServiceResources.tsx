import * as React from 'react';
import * as _ from 'lodash';
import * as plugins from '@console/internal/plugins';
import { podPhase } from '@console/internal/module/k8s';
import { AsyncComponent } from '@console/internal/components/utils';
import { PodModel } from '@console/internal/models';
import { AllPodStatus, OverviewItem } from '@console/shared';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';
import RevisionsOverviewList from './RevisionsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';

const REVISIONS_AUTOSCALED = 'All Revisions are autoscaled to 0';

const getResourceTabSectionComp = (t) => (props) => (
  <AsyncComponent {...props} loader={t.properties.loader} />
);

const getPluginTabSectionResource = (item) => {
  return plugins.registry
    .getOverviewTabSections()
    .filter((section) => item[section.properties.key])
    .map((section) => ({
      Component: getResourceTabSectionComp(section),
      key: section.properties.key,
    }));
};

type KnativeServiceResourceProps = {
  item: OverviewItem;
};

const KnativeServiceResources: React.FC<KnativeServiceResourceProps> = ({ item }) => {
  const { revisions, ksroutes, obj, pods } = item;
  const {
    kind: resKind,
    metadata: { name, namespace },
  } = obj;
  const activePods = _.filter(pods, (pod) => podPhase(pod) !== AllPodStatus.AutoScaledTo0);
  const linkUrl = `/search/ns/${namespace}?kind=${PodModel.kind}&q=${encodeURIComponent(
    `serving.knative.dev/${resKind.toLowerCase()}=${name}`,
  )}`;
  const pluginComponents = getPluginTabSectionResource(item);
  return (
    <>
      <PodsOverview
        pods={activePods}
        obj={obj}
        emptyText={REVISIONS_AUTOSCALED}
        allPodsLink={linkUrl}
      />
      {pluginComponents.map(({ Component, key }) => (
        <Component key={key} item={item} />
      ))}
      <RevisionsOverviewList revisions={revisions} service={obj} />
      <KSRoutesOverviewList ksroutes={ksroutes} resource={obj} />
    </>
  );
};

export default KnativeServiceResources;
