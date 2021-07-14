import { V1AddVolumeOptions } from './V1AddVolumeOptions';
import { V1RemoveVolumeOptions } from './V1RemoveVolumeOptions';

export interface V1VirtualMachineVolumeRequest {
  // AddVolumeOptions when set indicates a volume should be added. The details within this field specify how to add the volume.
  addVolumeOptions?: V1AddVolumeOptions;
  // RemoveVolumeOptions when set indicates a volume should be removed. The details within this field specify how to remove the volume.
  removeVolumeOptions?: V1RemoveVolumeOptions;
}
