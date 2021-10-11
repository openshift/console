import { k8sCreate, k8sGet, k8sKill, K8sResourceKind } from '@console/internal/module/k8s';
import { EXPORT_CR_NAME } from '../const';
import { ExportModel } from '../models/gitops-primer';

export const getExportAppData = (namespace: string) => {
  return {
    apiVersion: `${ExportModel.apiGroup}/${ExportModel.apiVersion}`,
    kind: ExportModel.kind,
    metadata: {
      name: EXPORT_CR_NAME,
      namespace,
    },
    spec: {
      method: 'download',
    },
  };
};

export const createExportResource = (res: K8sResourceKind) => k8sCreate(ExportModel, res);

export const getExportResource = (namespace: string) =>
  k8sGet(ExportModel, EXPORT_CR_NAME, namespace);

export const killExportResource = (res: K8sResourceKind) => k8sKill(ExportModel, res);
