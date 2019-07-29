import * as React from 'react';
import { DASH, getName, getNamespace } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { CUSTOM_FLAVOR } from '../../../constants/vm';
import { VMKind } from '../../../types/vm';
import {
  getDataVolumeTemplates,
  getDisks,
  getFlavor,
  getFlavorDescription,
  getInterfaces,
  getOperatingSystemName,
  getVolumes,
  getWorkloadProfile,
} from '../../../selectors/vm';
import { getStorageSize } from '../../../selectors/selectors';
import {
  getDataVolumeResources,
  getDataVolumeStorageClassName,
} from '../../../selectors/dv/selectors';
import { getPvcResources, getPvcStorageClassName } from '../../../selectors/pvc/selectors';

import './_clone-vm-modal.scss';

const getNicsDescription = (vm: VMKind) =>
  getInterfaces(vm).map(({ name, model }) => (
    <div key={name}>{model ? `${name} - ${model}` : name}</div>
  ));

const getDisksDescription = (
  vm: VMKind,
  pvcs: K8sResourceKind[],
  dataVolumes: K8sResourceKind[],
) => {
  const disks = getDisks(vm);
  const volumes = getVolumes(vm);
  const dataVolumeTemplates = getDataVolumeTemplates(vm);
  return disks.map((disk) => {
    const description = [disk.name];

    const volume = volumes.find((v) => v.name === disk.name);
    if (volume.dataVolume) {
      let dataVolume = dataVolumeTemplates.find((dv) => getName(dv) === volume.dataVolume.name);
      if (!dataVolume) {
        dataVolume = dataVolumes.find(
          (dv) => getName(dv) === volume.dataVolume.name && getNamespace(dv) === getNamespace(vm),
        );
      }
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
    return <div key={disk.name}>{description.join(' - ')}</div>;
  });
};

const getFullFlavorDescription = (vm: VMKind) => {
  const flavorDesc = getFlavorDescription(vm);
  const flavor = getFlavor(vm) || CUSTOM_FLAVOR;
  if (!flavorDesc) {
    return flavor;
  }
  return `${flavor} - ${flavorDesc}`;
};

export const ConfigurationSummary: React.FC<ConfigurationSummaryProps> = ({
  id,
  vm,
  persistentVolumeClaims,
  dataVolumes,
}) => {
  const disks = getDisksDescription(vm, persistentVolumeClaims, dataVolumes);
  const nics = getNicsDescription(vm);
  return (
    <dl id={id} className="kubevirt-clone-vm-modal__configuration-summary">
      <dt>Operating System</dt>
      <dd>{getOperatingSystemName(vm) || DASH}</dd>
      <dt>Flavor</dt>
      <dd>{getFullFlavorDescription(vm)}</dd>
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
  persistentVolumeClaims: K8sResourceKind[];
  dataVolumes: K8sResourceKind[];
};
