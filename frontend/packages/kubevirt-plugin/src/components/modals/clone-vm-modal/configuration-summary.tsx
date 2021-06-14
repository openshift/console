import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { DASH, getName, getNamespace } from '@console/shared';
import {
  getDataVolumeResources,
  getDataVolumeStorageClassName,
} from '../../../selectors/dv/selectors';
import { getPvcResources, getPvcStorageClassName } from '../../../selectors/pvc/selectors';
import { getStorageSize } from '../../../selectors/selectors';
import {
  getCPU,
  getDataVolumeTemplates,
  getDisks,
  getFlavor,
  getInterfaces,
  getMemory,
  getOperatingSystemName,
  getVolumes,
  getWorkloadProfile,
} from '../../../selectors/vm';
import { getFlavorData } from '../../../selectors/vm/flavor-data';
import { V1alpha1DataVolume } from '../../../types/api';
import { VMKind } from '../../../types/vm';

import './_clone-vm-modal.scss';

const getNicsDescription = (vm: VMKind) =>
  getInterfaces(vm).map(({ name, model }) => (
    <div key={name}>{model ? `${name} - ${model}` : name}</div>
  ));

const getDisksDescription = (
  vm: VMKind,
  pvcs: PersistentVolumeClaimKind[],
  dataVolumes: V1alpha1DataVolume[],
) => {
  const disks = getDisks(vm);
  const volumes = getVolumes(vm);
  const dataVolumeTemplates = getDataVolumeTemplates(vm);
  return disks.map((disk) => {
    const description = [disk.name];

    const volume = volumes.find((v) => v.name === disk.name);
    if (volume) {
      if (volume.dataVolume) {
        const dataVolume =
          dataVolumeTemplates.find((dv) => getName(dv) === volume.dataVolume.name) ||
          dataVolumes.find(
            (dv) => getName(dv) === volume.dataVolume.name && getNamespace(dv) === getNamespace(vm),
          );
        description.push(
          getStorageSize(getDataVolumeResources(dataVolume)),
          getDataVolumeStorageClassName(dataVolume),
        );
      } else if (volume.persistentVolumeClaim) {
        const pvc = pvcs.find((p) => getName(p) === volume.persistentVolumeClaim.claimName);
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
  dataVolumes,
}) => {
  const { t } = useTranslation();
  const disks = getDisksDescription(vm, persistentVolumeClaims, dataVolumes);
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
  dataVolumes: V1alpha1DataVolume[];
};
