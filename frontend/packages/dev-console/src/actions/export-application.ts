import { ToastContextType } from '@console/shared/src/components/toast/ToastContext';
import { handleExportApplication } from '@console/topology/src/components/export-app/ExportApplicationModal';
import { EXPORT_CR_NAME } from '@console/topology/src/const';

type ExportApplicationActionType = { namespace: string; toast: ToastContextType };

export const exportApplicationAction = ({ namespace, toast }: ExportApplicationActionType) => {
  const name = EXPORT_CR_NAME;
  return handleExportApplication(name, namespace, toast);
};
