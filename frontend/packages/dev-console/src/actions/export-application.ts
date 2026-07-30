import type { LaunchOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { ToastContextValues } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { handleExportApplication } from '@console/topology/src/components/export-app/ExportApplicationModal';
import { EXPORT_CR_NAME } from '@console/topology/src/const';

type ExportApplicationActionType = {
  namespace: string;
  toast: ToastContextValues;
  launchModal: LaunchOverlay;
};

export const exportApplicationAction = async ({
  namespace,
  toast,
  launchModal,
}: ExportApplicationActionType) => {
  await handleExportApplication(EXPORT_CR_NAME, namespace, toast, launchModal);
};
