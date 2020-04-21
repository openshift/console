export const snapshotData = {
  items: [
    {
      apiVersion: 'snapshot.storage.k8s.io/v1beta1',
      kind: 'VolumeSnapshot',
      metadata: {
        name: 'fakeSnapshot',
        namespace: 'fakes',
      },
      spec: {
        source: {
          persistentVolumeClaimName: 'fake-pvc',
        },
        volumeSnapshotClassName: 'fake-snc',
      },
      status: {
        readyToUse: true,
        restoreSize: '1Gi',
      },
    },
  ],
  breadcrumbs: [
    {
      name: 'Persistent Volume Claims',
      path: `/k8s/ns/fakes/persistentvolumeclaims`,
    },
    {
      name: 'Snapshot Details',
      path: '/k8s/ns/default/kind/example',
    },
  ],
  fakeModel: {
    abbr: 'fk',
    kind: 'fake',
    label: 'Fake',
    labelPlural: 'Fakes',
    plural: 'fakes',
    apiVersion: 'v1',
    apiGroup: 'fakeapi',
  },
};

export const newSnapshotData = {
  items: [
    {
      apiVersion: 'snapshot.storage.k8s.io/v1beta1',
      kind: 'VolumeSnapshot',
      metadata: {
        name: 'fakeSnapshot',
        namespace: 'fakes',
      },
      spec: {
        source: {
          persistentVolumeClaimName: 'fake-pvc',
        },
      },
    },
  ],
};

export const pvcData = {
  data: {
    apiVersion: 'v1',
    kind: 'PersistentVolumeClaim',
    metadata: {
      name: 'fake-pvc',
      namespace: 'fakes',
    },
    spec: {
      resources: {
        requests: {
          storage: '1Gi',
        },
      },
      storageClassName: 'fake-scn',
    },
    status: {
      phase: 'Bound',
      accessModes: ['ReadWriteOnce'],
      capacity: {
        storage: '1Gi',
      },
    },
  },
};
