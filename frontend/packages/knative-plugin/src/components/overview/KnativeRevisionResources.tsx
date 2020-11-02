import * as React from 'react';
import { K8sResourceKind, PodKind, podPhase } from '@console/internal/module/k8s';
import { PodsOverviewContent } from '@console/internal/components/overview/pods-overview';
import { usePodsForRevisions } from '../../utils/usePodsForRevisions';
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const revisions = React.useMemo(() => [obj], [obj.metadata.uid]);
  const [revisionPods, setRevisionPods] = React.useState<PodKind[]>([]);
  const { loaded, loadError, pods } = usePodsForRevisions(revisions, obj.metadata.namespace);
  React.useEffect(() => {
    if (loaded) {
      const revisionsPods = [];
      pods.forEach((pod) => {
        if (pod.pods) {
          revisionsPods.push(...pod.pods.filter((p) => podPhase(p as PodKind) !== AUTOSCALED));
        }
      });
      setRevisionPods(revisionsPods);
    }
  }, [loaded, pods]);

  return (
    <>
      <PodsOverviewContent
        obj={obj}
        pods={revisionPods}
        loaded={loaded}
        loadError={loadError}
        emptyText={AUTOSCALED}
        allPodsLink={linkUrl}
      />
      <DeploymentOverviewList current={pods?.[0]} />
      <KSRoutesOverviewList ksroutes={ksroutes} resource={obj} />
      <ConfigurationsOverviewList configurations={configurations} />
    </>
  );
};

export default KnativeRevisionResources;
