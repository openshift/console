export function getNADManifest(namespace: string, name: string, type: string) {
  const config = JSON.stringify({ type });

  return {
    apiVersion: `k8s.cni.cncf.io/v1`,
    kind: 'NetworkAttachmentDefinition',
    metadata: {
      name,
      namespace,
      annotations: {
        description: namespace,
      },
    },
    spec: {
      config,
    },
  };
}
