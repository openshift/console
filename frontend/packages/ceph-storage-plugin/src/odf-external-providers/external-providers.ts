export const StorageClusterIdentifier = 'storagecluster.ocs.openshift.io/v1';

export enum ExternalProviderId {
  RHCS = 'rhcs',
  IBM_FLASH = 'ibm-flash',
}

export const ODF_EXTERNAL_PROVIDERS: ExternalProvider[] = [
  {
    label: 'Red Hat Ceph Storage',
    kind: StorageClusterIdentifier,
    id: ExternalProviderId.RHCS,
  },
  {
    label: 'IBM FlashSystem',
    kind: 'flashsystemcluster.odf.ibm.com/v1alpha1',
    id: ExternalProviderId.IBM_FLASH,
  },
];

export type ExternalProvider = {
  /* The product name of the external system to be displayed in the dropdown selection */
  label: string;
  /* kind is a string represented as `<kind>.<apiGroup>/<apiVersion>` in the storage system CR `spec` */
  kind: string;
  /* name is a unique identifier that will be used in naming StorageSystems and sub-StorageSystems 
     e.g `odf-<name>-storage-system`.
  */
  id: ExternalProviderId;
};
