import * as React from 'react';
import { PodKind, K8sResourceKind } from '@console/internal/module/k8s';
import {
  OkIcon,
  OffIcon,
  UnknownIcon,
  InProgressIcon,
  HourglassHalfIcon,
  ErrorCircleOIcon,
} from '@patternfly/react-icons';
import { PopoverStatus, StatusIconAndText, getNamespace, getName } from '@console/shared';
import { Progress, ProgressVariant, ProgressSize } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { resourcePath } from '@console/internal/components/utils';
import { POD_DETAIL_OVERVIEW_HREF } from '@console/internal/components/utils/href';
import { PodModel } from '@console/internal/models';
import { VirtualMachineModel } from '../../models';
import { VM_DETAIL_EVENTS_HREF, CDI_KUBEVIRT_IO, STORAGE_IMPORT_PVC_NAME } from '../../constants';
import { getLabels } from '../../selectors/selectors';
import { getVMStatus } from '../../statuses/vm/vm';
import {
  VM_STATUS_V2V_CONVERSION_PENDING,
  VM_STATUS_VMI_WAITING,
  VM_STATUS_POD_ERROR,
  VM_STATUS_IMPORT_ERROR,
  VM_STATUS_V2V_CONVERSION_ERROR,
  VM_STATUS_IMPORTING,
  VM_STATUS_V2V_CONVERSION_IN_PROGRESS,
  VM_STATUS_STARTING,
  VM_STATUS_MIGRATING,
  VM_STATUS_RUNNING,
  VM_STATUS_OFF,
  VM_STATUS_ERROR,
} from '../../statuses/vm/constants';
import { VMKind } from '../../types';

import './vm-status.scss';

const VIEW_POD_OVERVIEW = 'View pod overview';
const VIEW_VM_EVENTS = 'View events';
const IMPORTING_VMWARE_MESSAGE =
  'The virtual machine is being imported from VMware. Disks will be converted to the libvirt format.';
const IMPORTING_ERROR_VMWARE_MESSAGE = 'The virtual machine could not be imported from VMware.';
const IMPORTING_MESSAGE =
  'The virtual machine is being imported. Disks are being copied from the source image.';
const IMPORTING_ERROR_MESSAGE = 'The virtual machine could not be imported.';
const VMI_WAITING_MESSAGE = 'The virtual machine is waiting for resources to become available.';
const STARTING_MESSAGE =
  'This virtual machine will start shortly. Preparing storage, networking, and compute resources.';

const getAdditionalImportText = (pod: PodKind): string => {
  const labels = getLabels(pod, {});
  const labelValue = labels[`${CDI_KUBEVIRT_IO}/${STORAGE_IMPORT_PVC_NAME}`];
  return labelValue ? ` (${labelValue})` : null;
};

const VmStatusPopover: React.FC<VmStatusPopoverProps> = ({
  IconComponent,
  title,
  message,
  children,
  progress,
  linkTo,
  linkMessage,
}) => (
  <PopoverStatus title={title} icon={<IconComponent />}>
    {message}
    {children && <div className="kubevirt-vm-status__detail-section">{children}</div>}
    {progress && (
      <div className="kubevirt-vm-status__detail-section">
        <Progress
          value={progress}
          title={title}
          variant={ProgressVariant.info}
          size={ProgressSize.sm}
        />
      </div>
    )}
    {linkTo && (
      <div className="kubevirt-vm-status__detail-section">
        <Link to={linkTo} title={linkMessage}>
          {linkMessage || linkTo}
        </Link>
      </div>
    )}
  </PopoverStatus>
);

const VmStatusInProgress: React.FC<VmStatusSpecificProps> = (props) => (
  <VmStatusPopover IconComponent={InProgressIcon} {...props} />
);
const VmStatusPending: React.FC<VmStatusSpecificProps> = (props) => (
  <VmStatusPopover IconComponent={HourglassHalfIcon} {...props} />
);
const VmStatusError: React.FC<VmStatusSpecificProps> = (props) => (
  <VmStatusPopover IconComponent={ErrorCircleOIcon} {...props} />
);

export const VmStatus: React.FC<VmStatusProps> = ({ vm, pods, migrations, verbose = false }) => {
  const statusDetail = getVMStatus(vm, pods, migrations);
  const linkToVMEvents = `${resourcePath(
    VirtualMachineModel.kind,
    getName(vm),
    getNamespace(vm),
  )}/${VM_DETAIL_EVENTS_HREF}`;
  const linkToPodOverview = `${resourcePath(
    PodModel.kind,
    getName(statusDetail.launcherPod),
    getNamespace(statusDetail.launcherPod),
  )}/${POD_DETAIL_OVERVIEW_HREF}`;
  const additionalText = verbose ? getAdditionalImportText(statusDetail.pod) : null;

  switch (statusDetail.status) {
    case VM_STATUS_V2V_CONVERSION_PENDING:
      return (
        <VmStatusPending
          title="Import pending (VMware)"
          message={IMPORTING_VMWARE_MESSAGE}
          linkMessage={VIEW_VM_EVENTS}
          linkTo={linkToVMEvents}
        >
          {statusDetail.message}
        </VmStatusPending>
      );
    case VM_STATUS_V2V_CONVERSION_ERROR:
      return (
        <VmStatusError
          title="Import error (VMware)"
          message={IMPORTING_ERROR_VMWARE_MESSAGE}
          linkMessage={VIEW_VM_EVENTS}
          linkTo={linkToVMEvents}
        >
          {statusDetail.message}
          {additionalText}
        </VmStatusError>
      );
    case VM_STATUS_V2V_CONVERSION_IN_PROGRESS:
      return (
        <VmStatusInProgress
          title="Importing (VMware)"
          message={IMPORTING_VMWARE_MESSAGE}
          linkMessage={VIEW_VM_EVENTS}
          linkTo={linkToVMEvents}
          progress={statusDetail.progress}
        >
          {additionalText}
        </VmStatusInProgress>
      );
    case VM_STATUS_POD_ERROR:
      return (
        <VmStatusError
          title="Pod error"
          message={statusDetail.message}
          linkMessage={VIEW_POD_OVERVIEW}
          linkTo={linkToPodOverview}
        />
      );
    case VM_STATUS_ERROR:
      return (
        <VmStatusError
          title="VM error"
          message={statusDetail.message}
          linkMessage={VIEW_VM_EVENTS}
          linkTo={linkToVMEvents}
        >
          {additionalText}
        </VmStatusError>
      );
    case VM_STATUS_IMPORT_ERROR:
      return (
        <VmStatusError
          title="Import error"
          message={IMPORTING_ERROR_MESSAGE}
          linkMessage={VIEW_VM_EVENTS}
          linkTo={linkToVMEvents}
        >
          {statusDetail.message}
          {additionalText}
        </VmStatusError>
      );
    case VM_STATUS_IMPORTING:
      return (
        <VmStatusInProgress
          title="Importing"
          message={IMPORTING_MESSAGE}
          linkMessage={VIEW_VM_EVENTS}
          linkTo={linkToVMEvents}
          progress={statusDetail.progress}
        >
          {additionalText}
        </VmStatusInProgress>
      );
    case VM_STATUS_VMI_WAITING:
      return (
        <VmStatusPending
          title="Pending"
          message={VMI_WAITING_MESSAGE}
          linkMessage={VIEW_VM_EVENTS}
          linkTo={linkToVMEvents}
        >
          {statusDetail.message}
        </VmStatusPending>
      );

    case VM_STATUS_STARTING:
      return (
        <VmStatusInProgress
          title="Starting"
          message={STARTING_MESSAGE}
          linkMessage={VIEW_VM_EVENTS}
          linkTo={linkToVMEvents}
          progress={statusDetail.progress}
        >
          {statusDetail.message}
        </VmStatusInProgress>
      );
    case VM_STATUS_MIGRATING:
      return (
        <VmStatusInProgress
          title="Migrating"
          message={statusDetail.message}
          linkMessage={VIEW_VM_EVENTS}
          linkTo={linkToVMEvents}
          progress={statusDetail.progress}
        />
      );
    case VM_STATUS_RUNNING:
      return <StatusIconAndText title="Running" icon={<OkIcon />} />;
    case VM_STATUS_OFF:
      return <StatusIconAndText title="Off" icon={<OffIcon />} />;
    default:
      return (
        <PopoverStatus title="Unknown" icon={<UnknownIcon />}>
          {statusDetail.status}
        </PopoverStatus>
      );
  }
};

type VmStatusSpecificProps = {
  title: string;
  children?: React.ReactNode;
  message: string;
  progress?: number;
  linkTo?: string;
  linkMessage?: string;
};

type VmStatusPopoverProps = VmStatusSpecificProps & {
  IconComponent: React.ComponentType<{}>;
};

type VmStatusProps = {
  vm: VMKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
  verbose?: boolean;
};
