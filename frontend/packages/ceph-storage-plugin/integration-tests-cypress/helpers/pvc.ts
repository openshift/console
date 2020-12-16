export const getPVCJSON = (
  name: string,
  namespace: string,
  storageClassName: string,
  size: string = '5Gi',
  volumeMode: string = 'Filesystem',
) => ({
  apiVersion: 'v1',
  kind: 'PersistentVolumeClaim',
  metadata: {
    name,
    namespace,
  },
  spec: {
    accessModes: ['ReadWriteOnce'],
    resources: {
      requests: {
        storage: size,
      },
    },
    storageClassName,
    volumeMode,
  },
});
