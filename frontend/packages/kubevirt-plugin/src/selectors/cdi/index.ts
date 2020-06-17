import { K8sResourceKind } from '@console/internal/module/k8s';

export const getUploadProxyURL = (config: K8sResourceKind) => config?.status?.uploadProxyURL;
