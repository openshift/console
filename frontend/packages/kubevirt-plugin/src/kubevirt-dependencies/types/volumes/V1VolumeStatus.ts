import { V1HotplugVolumeStatus } from './V1HotplugVolumeStatus';

// VolumeStatus represents information about the status of volumes attached to the VirtualMachineInstance.
export interface V1VolumeStatus {
  // If the volume is hotplug, this will contain the hotplug status.
  hotplugVolume?: V1HotplugVolumeStatus;
  // Message is a detailed message about the current hotplug volume phase.
  message?: string;
  // Name is the name of the volume - Required.
  name: string;
  // phase of volume.
  phase?: string;
  // Reason is a brief description of why we are in the current hotplug volume phase
  reason?: string;
  // Target is the target name used when adding the volume to the VM, eg: vda - Required.
  target: string;
}
