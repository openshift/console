import { K8sResourceKind } from '@console/internal/module/k8s';

export const getSecretUsername = (secret: K8sResourceKind): string =>
  secret && secret.data && atob(secret.data.username);
export const getSecretPassword = (secret: K8sResourceKind): string =>
  secret && secret.data && atob(secret.data.password);
