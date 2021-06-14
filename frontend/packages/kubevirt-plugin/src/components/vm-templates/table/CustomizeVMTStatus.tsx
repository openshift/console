import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PersistentVolumeClaimKind, PodKind } from '@console/internal/module/k8s';
import { getVMStatus } from '../../../statuses/vm/vm-status';
import { VMIKind, VMKind } from '../../../types';
import { V1alpha1DataVolume } from '../../../types/api';
import cancelCustomizationModal from '../../modals/template-customization/CancelCustomizationModal';
import {
  getPodLink,
  getVMILikeLink,
  ImporterPods,
  LinkType,
  VIEW_POD_LOGS,
  VIEW_VM_EVENTS,
  VMStatusPopoverContent,
} from '../../vm-status/vm-status';

type CustomizeVMTStatusProps = {
  vmi: VMIKind;
  vm: VMKind;
  pvcs: PersistentVolumeClaimKind[];
  dataVolumes: V1alpha1DataVolume[];
  pods: PodKind[];
};

const CustomizeVMTStatus: React.FC<CustomizeVMTStatusProps> = ({
  vm,
  vmi,
  pods,
  pvcs,
  dataVolumes,
}) => {
  const { t } = useTranslation();
  const vmStatusBundle = getVMStatus({
    vm,
    vmi,
    pods,
    pvcs,
    dataVolumes,
  });

  const message = vmStatusBundle.message || vmStatusBundle.detailedMessage;
  const detailedMessage = vmStatusBundle.message ? vmStatusBundle.detailedMessage : null;

  const links: LinkType[] = [];

  if (vm || vmi) {
    links.push({ to: getVMILikeLink(vm || vmi), message: VIEW_VM_EVENTS });
  }

  if (vmStatusBundle.pod) {
    links.push({ to: `${getPodLink(vmStatusBundle.pod)}/logs`, message: VIEW_POD_LOGS });
  }

  return (
    <VMStatusPopoverContent
      message={message}
      links={[
        ...links,
        {
          to: 'customization-modal',
          action: () => cancelCustomizationModal({ vm }),
          message: t('kubevirt-plugin~Cancel customization'),
        },
      ]}
      progress={vmStatusBundle.progress}
    >
      {detailedMessage}
      <ImporterPods statuses={vmStatusBundle.importerPodsStatuses} />
    </VMStatusPopoverContent>
  );
};

export default CustomizeVMTStatus;
