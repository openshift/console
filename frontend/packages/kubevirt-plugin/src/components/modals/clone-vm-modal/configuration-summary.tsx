import './_clone-vm-modal.scss';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { getName } from '../../../selectors';
import { getPvcResources, getPvcStorageClassName } from '../../../selectors/pvc/selectors';
import { getStorageSize } from '../../../selectors/selectors';
import { getFlavorData } from '../../../selectors/vm/flavor-data';
import {
  getCPU,
  getDisks,
  getFlavor,
  getInterfaces,
  getMemory,
  getOperatingSystemName,
  getVolumes,
  getWorkloadProfile,
} from '../../../selectors/vm/selectors';
import { VMKind } from '../../../types/vm';
import { DASH } from '../../../utils';

const getNicsDescription = (vm: VMKind) =>
  getInterfaces(vm).map(({ name, model }) => (
    <div key={name}>{model ? `${name} - ${model}` : name}</div>
  ));

const getDisksDescription = (vm: VMKind, pvcs: PersistentVolumeClaimKind[]) => {
  const disks = getDisks(vm);
  const volumes = getVolumes(vm);

  return disks.map((disk) => {
    const description = [disk.name];

    const volume = volumes.find((v) => v.name === disk.name);
    if (volume) {
      if (volume.dataVolume || volume.persistentVolumeClaim) {
        const pvc = pvcs.find(
          (p) =>
            getName(p) === volume.persistentVolumeClaim?.claimName ||
            getName(p) === volume.dataVolume?.name,
        );
        description.push(getStorageSize(getPvcResources(pvc)), getPvcStorageClassName(pvc));
      } else if (volume.containerDisk) {
        description.push('container disk');
      } else if (volume.cloudInitNoCloud) {
        description.push('cloud-init disk');
      }
    }
    return <div key={disk.name}>{description.join(' - ')}</div>;
  });
};

export const ConfigurationSummary: React.FC<ConfigurationSummaryProps> = ({
  id,
  vm,
  persistentVolumeClaims,
}) => {
  const { t } = useTranslation();
  const disks = getDisksDescription(vm, persistentVolumeClaims);
  const nics = getNicsDescription(vm);
  return (
    <dl id={id} className="kubevirt-clone-vm-modal__configuration-summary">
      <dt>Operating System</dt>
      <dd>{getOperatingSystemName(vm) || DASH}</dd>
      <dt>Flavor</dt>
      <dd>
        {t(
          'kubevirt-plugin~{{flavor}}: {{count}} CPU | {{memory}} Memory',
          getFlavorData({
            flavor: getFlavor(vm),
            cpu: getCPU(vm),
            memory: getMemory(vm),
          }),
        )}
      </dd>
      <dt>Workload Profile</dt>
      <dd>{getWorkloadProfile(vm) || DASH}</dd>
      <dt>NICs</dt>
      <dd>{nics.length > 0 ? nics : DASH}</dd>
      <dt>Disks</dt>
      <dd>{disks.length > 0 ? disks : DASH}</dd>
    </dl>
  );
};

type ConfigurationSummaryProps = {
  id: string;
  vm: VMKind;
  persistentVolumeClaims: PersistentVolumeClaimKind[];
};
