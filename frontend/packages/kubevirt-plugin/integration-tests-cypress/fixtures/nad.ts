export default {
  apiVersion: 'k8s.cni.cncf.io/v1',
  kind: 'NetworkAttachmentDefinition',
  metadata: {
    name: 'bridge-network',
    namespace: 'default',
    annotations: {
      'k8s.v1.cni.cncf.io/resourceName': 'bridge.network.kubevirt.io/br0',
    },
  },
  spec: {
    config:
      '{"cniVersion": "0.3.1","name": "br0-l2", "plugins": [{"type": "bridge", "bridge": "br0", "ipam": {}}]}',
  },
};
