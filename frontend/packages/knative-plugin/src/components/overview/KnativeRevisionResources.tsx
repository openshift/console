import * as React from 'react';
import { K8sResourceKind, podPhase } from '@console/internal/module/k8s';
import { usePodsWatcher } from '@console/shared';
import { StatusBox } from '@console/internal/components/utils';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';
import ConfigurationsOverviewList from './ConfigurationsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';
import DeploymentOverviewList from './DeploymentOverviewList';

const AUTOSCALED = 'Autoscaled to 0';
type KnativeRevisionResourceProps = {
  ksroutes: K8sResourceKind[];
  configurations: K8sResourceKind[];
  obj: K8sResourceKind;
};

const KnativeRevisionResources: React.FC<KnativeRevisionResourceProps> = ({
  ksroutes,
  configurations,
  obj,
}) => {
  const {
    kind: resKind,
    metadata: { name, namespace },
  } = obj;
  const linkUrl = `/search/ns/${namespace}?kind=Pod&q=${encodeURIComponent(
    `serving.knative.dev/${resKind.toLowerCase()}=${name}`,
  )}`;
  const { podData, loaded, loadError } = usePodsWatcher(obj, obj.kind, namespace);
  return (
    <StatusBox loaded={loaded} data={podData} loadError={loadError}>
      <PodsOverview
        obj={obj}
        emptyText={AUTOSCALED}
        allPodsLink={linkUrl}
        podsFilter={(pod) => podPhase(pod) !== AUTOSCALED}
      />
      <DeploymentOverviewList current={podData?.current} />
      <KSRoutesOverviewList ksroutes={ksroutes} resource={obj} />
      <ConfigurationsOverviewList configurations={configurations} />
    </StatusBox>
  );
};

export default KnativeRevisionResources;
