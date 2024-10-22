export const getUDN = (name: string, namespace: string, subnetsString: string) => ({
  apiVersion: 'k8s.ovn.org/v1',
  kind: 'UserDefinedNetwork',
  metadata: {
    name,
    namespace,
  },
  spec: {
    topology: 'Layer2',
    layer2: {
      role: 'Primary',
      subnets: subnetsString.split(','),
      ipamLifecycle: 'Persistent',
    },
  },
});
