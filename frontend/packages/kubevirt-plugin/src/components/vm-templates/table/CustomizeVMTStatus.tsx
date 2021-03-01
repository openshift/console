import * as React from 'react';
import { PersistentVolumeClaimKind, PodKind } from '@console/internal/module/k8s';
import { useTranslation } from 'react-i18next';

import { VMIKind, VMKind } from '../../../types';
import { getVMStatus } from '../../../statuses/vm/vm-status';
import {
  VMStatusPopoverContent,
  ImporterPods,
  LinkType,
  getVMILikeLink,
  getPodLink,
  VIEW_VM_EVENTS,
  VIEW_POD_LOGS,
} from '../../vm-status/vm-status';
import { V1alpha1DataVolume } from '../../../types/api';
import cancelCustomizationModal from '../../modals/template-customization/CancelCustomizationModal';

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
