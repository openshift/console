import { SecretKind } from '@console/internal/module/k8s/types';

export const getSecretUsername = (secret: SecretKind): string =>
  secret && secret.data && atob(secret.data.username);
export const getSecretPassword = (secret: SecretKind): string =>
  secret && secret.data && atob(secret.data.password);
