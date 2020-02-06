import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceKind, PodKind, podPhase } from '@console/internal/module/k8s';
import { PodControllerOverviewItem } from '@console/shared';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';
import ConfigurationsOverviewList from './ConfigurationsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';
import DeploymentOverviewList from './DeploymentOverviewList';

const AUTOSCALED = 'Autoscaled to 0';
type KnativeRevisionResourceProps = {
  ksroutes: K8sResourceKind[];
  configurations: K8sResourceKind[];
  obj: K8sResourceKind;
  pods?: PodKind[];
  current?: PodControllerOverviewItem;
};

const KnativeRevisionResources: React.FC<KnativeRevisionResourceProps> = ({
  ksroutes,
  configurations,
  obj,
  pods,
  current,
}) => {
  const {
    kind: resKind,
    metadata: { name, namespace },
  } = obj;
  const activePods = _.filter(pods, (pod) => podPhase(pod) !== AUTOSCALED);
  const linkUrl = `/search/ns/${namespace}?kind=Pod&q=${encodeURIComponent(
    `serving.knative.dev/${resKind.toLowerCase()}=${name}`,
  )}`;
  return (
    <>
      <PodsOverview pods={activePods} obj={obj} emptyText={AUTOSCALED} allPodsLink={linkUrl} />
      <DeploymentOverviewList current={current} />
      <KSRoutesOverviewList ksroutes={ksroutes} resource={obj} />
      <ConfigurationsOverviewList configurations={configurations} />
    </>
  );
};

export default KnativeRevisionResources;
