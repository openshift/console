import * as React from 'react';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../../models';
import { getMatchedPVCs } from '../../../utils/pipeline-utils';

export interface VolumeClaimTemplatesSectionProps {
  namespace: string;
  ownerResourceName: string;
  ownerResourceKind?: string;
}

const VolumeClaimTemplatesSection: React.FC<VolumeClaimTemplatesSectionProps> = ({
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
    <DescriptionListGroup data-test-id="volumeClaimTemplate-resources-section">
      <DescriptionListTerm>
        {t('pipelines-plugin~VolumeClaimTemplate Resources')}
      </DescriptionListTerm>
      <DescriptionListDescription>
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
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

export default VolumeClaimTemplatesSection;
