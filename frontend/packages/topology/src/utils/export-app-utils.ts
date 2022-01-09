import { k8sCreate, k8sGet, k8sKill, K8sResourceKind } from '@console/internal/module/k8s';
import { ExportModel } from '../models/gitops-primer';

export const getExportAppData = (name: string, namespace: string) => {
  return {
    apiVersion: `${ExportModel.apiGroup}/${ExportModel.apiVersion}`,
    kind: ExportModel.kind,
    metadata: {
      name,
      namespace,
    },
    spec: {
      method: 'download',
    },
  };
};

export const createExportResource = (res: K8sResourceKind) => k8sCreate(ExportModel, res);

export const getExportResource = (name: string, namespace: string) =>
  k8sGet(ExportModel, name, namespace);

export const killExportResource = (res: K8sResourceKind) => k8sKill(ExportModel, res);
