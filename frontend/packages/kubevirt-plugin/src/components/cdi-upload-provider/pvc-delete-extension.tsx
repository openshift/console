import * as React from 'react';
import { k8sKill, PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { DataVolumeModel } from '../../models';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { TEMPLATE_VM_GOLDEN_OS_NAMESPACE } from '../../constants';

export const killCDIBoundPVC = (pvc: PersistentVolumeClaimKind) =>
  k8sKill(DataVolumeModel, {
    metadata: {
      name: pvc?.metadata?.name,
      namespace: pvc?.metadata?.namespace,
    },
  });

export const PVCDeleteAlertExtension: React.FC<{ pvc: PersistentVolumeClaimKind }> = ({ pvc }) => {
  const goldenPvcsResource: WatchK8sResource = {
    isList: true,
    optional: true,
    kind: PersistentVolumeClaimModel.kind,
    namespace: TEMPLATE_VM_GOLDEN_OS_NAMESPACE,
  };
  const [goldenPvcs, loadedPvcs, errorPvcs] = useK8sWatchResource<PersistentVolumeClaimKind[]>(
    goldenPvcsResource,
  );

  const isGolden =
    pvc?.metadata?.namespace === TEMPLATE_VM_GOLDEN_OS_NAMESPACE &&
    goldenPvcs.find((goldenPvc) => goldenPvc?.metadata?.name === pvc?.metadata?.name);

  return (
    <>
      <p>
        Deleting this PVC will also delete{' '}
        <strong className="co-break-word">{pvc?.metadata?.name}</strong> Data Volume
      </p>
      {!loadedPvcs && <p>Checking for usages of this PVC...</p>}
      {errorPvcs && <p>Error checking for usages of this PVC.</p>}
      {isGolden && (
        <p>
          <strong className="co-break-word">WARNING:</strong> this PVC is used as a base operating
          system image. New VMs will not be able to clone this image
        </p>
      )}
    </>
  );
};
