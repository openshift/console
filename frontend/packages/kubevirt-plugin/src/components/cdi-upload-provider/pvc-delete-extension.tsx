import * as React from 'react';
import { k8sKill, PersistentVolumeClaimKind, TemplateKind } from '@console/internal/module/k8s';
import { DataVolumeModel } from '../../models';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { TemplateModel } from '@console/internal/models';
import {
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_VM_COMMON_NAMESPACE,
} from '../../constants';
import { usePVCBaseImages } from '../../hooks/use-pvc-base-images';

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
  const [goldenPvcs, loadedPvcs, errorPvcs] = usePVCBaseImages(commonTemplates);

  const isGolden = goldenPvcs.find(
    (goldenPvc) => goldenPvc?.metadata?.name === pvc?.metadata?.name,
  );

  return (
    <>
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
    </>
  );
};
