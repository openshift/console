import { registerTemplate } from '../../yaml-templates';

registerTemplate('v1alpha1.VaultService', `
  apiVersion: vault.security.coreos.com/v1alpha1
  kind: VaultService
  metadata:
    name: example
  spec:
    nodes: 2
    version: 0.8.3-0
`);
