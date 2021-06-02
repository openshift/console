import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { LoadingInline } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { PodModel } from '@console/internal/models';
import { K8sResourceKind, modelFor } from '@console/internal/module/k8s';
import { PodRing, ExtPodKind } from '@console/shared';
import { GitOpsResource } from '../utils/gitops-types';

interface PodRingWrapperProps {
  workload: GitOpsResource;
}

const PodRingWrapper: React.FC<PodRingWrapperProps> = ({ workload }) => {
  const { t } = useTranslation();
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

  const [pods, loaded, loadError] = useK8sWatchResource<ExtPodKind[]>(podResource);

  if (!loaded && !loadError) {
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
        <div style={{ border: '1px solid' }}>{t('gitops-plugin~Pod info not available')}</div>
      )}
    </>
  );
};

export default PodRingWrapper;
