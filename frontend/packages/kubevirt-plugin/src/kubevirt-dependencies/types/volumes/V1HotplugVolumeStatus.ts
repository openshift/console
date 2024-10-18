// HotplugVolumeStatus represents the hotplug status of the volume
export interface V1HotplugVolumeStatus {
  // AttachPodName is the name of the pod used to attach the volume to the node.
  attachPodName?: string;
  // AttachPodUID is the UID of the pod used to attach the volume to the node.
  attachPodUID?: string;
}
