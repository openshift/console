import type { LaunchOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ToastContextType } from '@console/shared/src/components/toast/ToastContext';
import { handleExportApplication } from '@console/topology/src/components/export-app/ExportApplicationModal';
import { EXPORT_CR_NAME } from '@console/topology/src/const';

type ExportApplicationActionType = {
  namespace: string;
  toast: ToastContextType;
  launchModal: LaunchOverlay;
};

export const exportApplicationAction = async ({
  namespace,
  toast,
  launchModal,
}: ExportApplicationActionType) => {
  await handleExportApplication(EXPORT_CR_NAME, namespace, toast, launchModal);
};
