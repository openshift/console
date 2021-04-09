import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { ResourceLink } from '@console/internal/components/utils';
import { PipelineRunModel } from '../../../models';
import { getMatchedPVCs } from '../../../utils/pipeline-utils';

export interface VolumeClaimTemplatesLinkProps {
  namespace: string;
  ownerResourceName: string;
  ownerResourceKind: string;
}

const VolumeClaimTemplatesLink: React.FC<VolumeClaimTemplatesLinkProps> = ({
  namespace,
  ownerResourceName,
  ownerResourceKind = PipelineRunModel.kind,
}) => {
  const [pvcResources, loaded, loadError] = useK8sWatchResource<PersistentVolumeClaimKind[]>({
    kind: PersistentVolumeClaimModel.kind,
    isList: true,
    namespace,
  });

  const { t } = useTranslation();

  if (!ownerResourceName || !loaded || loadError || pvcResources?.length === 0) return null;

  const matchedPVCs = getMatchedPVCs(pvcResources, ownerResourceName, ownerResourceKind);

  if (!matchedPVCs || matchedPVCs.length === 0) return null;

  return (
    <dl>
      <dt>{t('pipelines-plugin~VolumeClaimTemplate Resources')}</dt>
      <dd>
        {matchedPVCs.map((pvcResource) => {
          return (
            <ResourceLink
              name={pvcResource.metadata.name}
              key={pvcResource.metadata.name}
              namespace={pvcResource.metadata.namespace}
              kind={PersistentVolumeClaimModel.kind}
            />
          );
        })}
      </dd>
    </dl>
  );
};

export default VolumeClaimTemplatesLink;
