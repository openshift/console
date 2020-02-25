import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceKind, podPhase, PodKind } from '@console/internal/module/k8s';
import { PodModel } from '@console/internal/models';
import { AllPodStatus } from '@console/shared';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';
import RevisionsOverviewList from './RevisionsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';

const REVISIONS_AUTOSCALED = 'All Revisions are autoscaled to 0';

type KnativeServiceResourceProps = {
  obj: K8sResourceKind;
  revisions: K8sResourceKind[];
  ksroutes: K8sResourceKind[];
  pods?: PodKind[];
};

const KnativeServiceResources: React.FC<KnativeServiceResourceProps> = ({
  revisions,
  ksroutes,
  obj,
  pods,
}) => {
  const {
    kind: resKind,
    metadata: { name, namespace },
  } = obj;
  const activePods = _.filter(pods, (pod) => podPhase(pod) !== AllPodStatus.AutoScaledTo0);
  const linkUrl = `/search/ns/${namespace}?kind=${PodModel.kind}&q=${encodeURIComponent(
    `serving.knative.dev/${resKind.toLowerCase()}=${name}`,
  )}`;
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
    </>
  );
};

export default KnativeServiceResources;
