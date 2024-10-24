// RemoveVolumeOptions is provided when dynamically hot unplugging volume and disk
export interface V1RemoveVolumeOptions {
  // Name represents the name that maps to both the disk and volume that should be removed.
  name: string;
}
