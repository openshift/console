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
