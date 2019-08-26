export const mockPipelineResourceData = {
  git: {
    type: 'git',
    params: {
      url: 'https://github.com/wizzbangcorp/wizzbang.git',
      revision: 'master',
    },
  },
  image: {
    type: 'image',
    params: {
      url: 'gcr.io/staging-images/kritis',
    },
  },
  storage: {
    type: 'storage',
    params: {
      type: 'gcs',
      location: 'gs://some-bucket',
      dir: '',
    },
  },
  cluster: {
    type: 'cluster',
    params: {
      name: 'cluster1',
      url: 'https://10.10.10.10',
      username: 'admin',
      password: '',
      insecure: '',
    },
    secrets: {
      cadata: 'somedata',
      token: 'somedata',
    },
  },
};
