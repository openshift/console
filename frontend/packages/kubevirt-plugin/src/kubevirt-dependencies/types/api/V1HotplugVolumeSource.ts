import { V1DataVolumeSource } from './V1DataVolumeSource';
import { V1PersistentVolumeClaimVolumeSource } from './V1PersistentVolumeClaimVolumeSource';

// HotplugVolumeSource Represents the source of a volume to mount which are capable of being hotplugged on a live running VMI. Only one of its members may be specified.
export interface V1HotplugVolumeSource {
  // DataVolume represents the dynamic creation a PVC for this volume as well as the process of populating that PVC with a disk image.
  dataVolume?: V1DataVolumeSource;
  // PersistentVolumeClaimVolumeSource represents a reference to a PersistentVolumeClaim in the same namespace. Directly attached to the vmi via qemu. More info: https://kubernetes.io/docs/concepts/storage/persistent-volumes#persistentvolumeclaims
  persistentVolumeClaim?: V1PersistentVolumeClaimVolumeSource;
}
