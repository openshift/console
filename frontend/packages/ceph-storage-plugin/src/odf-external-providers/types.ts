export type ExternalProvider = {
  /* The product name of the external system to be displayed in the dropdown selection */
  label: string;
  /* kind is a string represented as `<kind>.<apiGroup>/<apiVersion>` in the storage system CR `spec` */
  kind: string;
  /* id is a unique identifier that will be used in naming StorageSystems and sub-StorageSystems 
       e.g `odf-<name>-storage-system`.
    */
  id: string;
};
