import type { ToastContextType } from '@console/shared/src/components/toast/ToastContext';
import { ExportApplicationModalOverlay } from '@console/topology/src/components/export-app/ExportApplicationModal';
import { EXPORT_CR_NAME } from '@console/topology/src/const';
import { getExportResource } from '@console/topology/src/utils/export-app-utils';

type ExportApplicationActionType = {
  namespace: string;
  toast: ToastContextType;
  launchModal: (component: React.ComponentType<any>, props: Record<string, any>) => void;
};

export const exportApplicationAction = async ({
  namespace,
  toast,
  launchModal,
}: ExportApplicationActionType) => {
  const name = EXPORT_CR_NAME;
  try {
    const exportRes = await getExportResource(name, namespace);
    launchModal(ExportApplicationModalOverlay, {
      name,
      namespace,
      exportResource: exportRes,
      toast,
    });
  } catch {
    launchModal(ExportApplicationModalOverlay, { name, namespace, toast });
  }
};
