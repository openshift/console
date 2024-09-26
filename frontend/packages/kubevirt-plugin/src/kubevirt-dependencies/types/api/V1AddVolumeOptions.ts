import { V1Disk } from './V1Disk';
import { V1HotplugVolumeSource } from './V1HotplugVolumeSource';

// AddVolumeOptions is provided when dynamically hot plugging a volume and disk
export interface V1AddVolumeOptions {
  // Disk represents the hotplug disk that will be plugged into the running VMI.
  disk: V1Disk;
  // Name represents the name that will be used to map the disk to the corresponding volume. This overrides any name set inside the Disk struct itself.
  name: string;
  // VolumeSource represents the source of the volume to map to the disk.
  volumeSource: V1HotplugVolumeSource;
}
