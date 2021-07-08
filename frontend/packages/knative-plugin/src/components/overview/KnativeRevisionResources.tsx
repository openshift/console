import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PodsOverviewContent } from '@console/internal/components/overview/pods-overview';
import { K8sResourceKind, PodKind, podPhase } from '@console/internal/module/k8s';
import { AllPodStatus } from '@console/shared';
import { usePodsForRevisions } from '../../utils/usePodsForRevisions';
import ConfigurationsOverviewList from './ConfigurationsOverviewList';
import DeploymentOverviewList from './DeploymentOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';

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
  const { t } = useTranslation();
  const {
    kind: resKind,
    metadata: { name, namespace },
  } = obj;
  const linkUrl = `/search/ns/${namespace}?kind=Pod&q=${encodeURIComponent(
    `serving.knative.dev/${resKind.toLowerCase()}=${name}`,
  )}`;
  const { loaded, loadError, pods } = usePodsForRevisions(obj.metadata.uid, obj.metadata.namespace);
  const revisionPods = React.useMemo(() => {
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
        pods={revisionPods}
        loaded={loaded}
        loadError={loadError}
        emptyText={t('knative-plugin~Autoscaled to 0')}
        allPodsLink={linkUrl}
      />
      <DeploymentOverviewList current={pods?.[0]} />
      <KSRoutesOverviewList ksroutes={ksroutes} resource={obj} />
      <ConfigurationsOverviewList configurations={configurations} />
    </>
  );
};

export default KnativeRevisionResources;
