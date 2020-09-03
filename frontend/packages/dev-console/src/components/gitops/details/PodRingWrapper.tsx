import * as React from 'react';
import * as _ from 'lodash';
import { PodModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, modelFor } from '@console/internal/module/k8s';
import { PodRing, ExtPodKind } from '@console/shared';
import { LoadingInline } from '@console/internal/components/utils';
import { GitOpsResource } from '../utils/gitops-types';

interface PodRingWrapperProps {
  workload: GitOpsResource;
}

const PodRingWrapper: React.FC<PodRingWrapperProps> = ({ workload }) => {
  const workloadResource = React.useMemo(
    () => ({
      kind: workload?.kind,
      namespace: workload?.namespace,
      name: workload?.name,
      optional: true,
    }),
    [workload],
  );

  const [workloadData] = useK8sWatchResource<K8sResourceKind>(workloadResource);

  const podResource = React.useMemo(
    () => ({
      kind: PodModel.kind,
      namespace: workload?.namespace,
      selector: workloadData?.spec?.selector,
      isList: true,
      optional: true,
    }),
    [workload, workloadData],
  );

  const [pods, loaded] = useK8sWatchResource<ExtPodKind[]>(podResource);

  if (!loaded) {
    return <LoadingInline />;
  }

  return (
    <>
      {loaded && !_.isEmpty(workloadData) && !_.isEmpty(pods) ? (
        <PodRing
          pods={pods}
          resourceKind={modelFor(workload?.kind)}
          obj={workloadData}
          enableScaling={false}
        />
      ) : (
        <div style={{ border: '1px solid' }}>Pod Info Not Available</div>
      )}
    </>
  );
};

export default PodRingWrapper;
