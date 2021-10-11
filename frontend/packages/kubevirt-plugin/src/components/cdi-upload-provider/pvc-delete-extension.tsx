import * as React from 'react';
import { Alert, AlertVariant } from '@patternfly/react-core';
import { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { TemplateModel } from '@console/internal/models';
import { k8sKill, PersistentVolumeClaimKind, TemplateKind } from '@console/internal/module/k8s';
import {
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_VM_COMMON_NAMESPACE,
} from '../../constants';
import { useBaseImages } from '../../hooks/use-base-images';
import { DataVolumeModel } from '../../models';

export const killCDIBoundPVC = (pvc: PersistentVolumeClaimKind) =>
  k8sKill(DataVolumeModel, {
    metadata: {
      name: pvc?.metadata?.name,
      namespace: pvc?.metadata?.namespace,
    },
  });

export const PVCDeleteAlertExtension: React.FC<{ pvc: PersistentVolumeClaimKind }> = ({ pvc }) => {
  const templatesResource: WatchK8sResource = {
    isList: true,
    optional: true,
    kind: TemplateModel.kind,
    namespace: TEMPLATE_VM_COMMON_NAMESPACE,
    selector: {
      matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_BASE },
    },
  };
  const [commonTemplates, loadedTemplates, errorTemplates] = useK8sWatchResource<TemplateKind[]>(
    templatesResource,
  );
  const [goldenPvcs, loadedPvcs, errorPvcs] = useBaseImages(commonTemplates);

  const isGolden = goldenPvcs.find(
    (goldenPvc) => goldenPvc?.metadata?.name === pvc?.metadata?.name,
  );

  return (
    <Alert isInline variant={AlertVariant.warning} title="PVC Delete">
      <p>
        Deleting this PVC will also delete{' '}
        <strong className="co-break-word">{pvc?.metadata?.name}</strong> Data Volume
      </p>
      {!loadedPvcs && !loadedTemplates && <p>Checking for usages of this PVC...</p>}
      {(errorPvcs || errorTemplates) && <p>Error checking for usages of this PVC.</p>}
      {isGolden && (
        <p>
          <strong className="co-break-word">WARNING:</strong> this PVC is used as a base operating
          system image. New VMs will not be able to clone this image
        </p>
      )}
    </Alert>
  );
};
