export const mockPipelineServiceAccount = {
  kind: 'ServiceAccount',
  apiVersion: 'v1',
  metadata: {
    name: 'pipeline',
    namespace: 'karthik',
    uid: 'fc2e60f5-d42f-4ba7-82ee-e03be2cbe2a8',
  },
  secrets: [
    {
      name: 'pipeline-dockercfg-p2jwc',
    },
  ],
  imagePullSecrets: [
    {
      name: 'pipeline-dockercfg-p2jwc',
    },
  ],
};
