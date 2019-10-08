import * as React from 'react';
import { PodKind, K8sResourceKind } from '@console/internal/module/k8s';
import { OffIcon, UnknownIcon } from '@patternfly/react-icons';
import {
  PopoverStatus,
  StatusIconAndText,
  getNamespace,
  getName,
  ErrorStatus,
  ProgressStatus,
  PendingStatus,
  SuccessStatus,
} from '@console/shared';
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

const VmStatusPopoverContent: React.FC<VmStatusPopoverContentProps> = ({
  message,
  children,
  progress,
  linkTo,
  linkMessage,
}) => (
  <>
    {message}
    {children && <div className="kubevirt-vm-status__detail-section">{children}</div>}
    {progress && (
      <div className="kubevirt-vm-status__detail-section">
        <Progress value={progress} variant={ProgressVariant.info} size={ProgressSize.sm} />
      </div>
    )}
    {linkTo && (
      <div className="kubevirt-vm-status__detail-section">
        <Link to={linkTo} title={linkMessage}>
          {linkMessage || linkTo}
        </Link>
      </div>
    )}
  </>
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
        <PendingStatus title="Import pending (VMware)">
          <VmStatusPopoverContent
            message={IMPORTING_VMWARE_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
          >
            {statusDetail.message}
          </VmStatusPopoverContent>
        </PendingStatus>
      );
    case VM_STATUS_V2V_CONVERSION_ERROR:
      return (
        <ErrorStatus title="Import error (VMware)">
          <VmStatusPopoverContent
            message={IMPORTING_ERROR_VMWARE_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
          >
            {statusDetail.message}
            {additionalText}
          </VmStatusPopoverContent>
        </ErrorStatus>
      );
    case VM_STATUS_V2V_CONVERSION_IN_PROGRESS:
      return (
        <ProgressStatus title="Importing (VMware)">
          <VmStatusPopoverContent
            message={IMPORTING_VMWARE_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
            progress={statusDetail.progress}
          >
            {additionalText}
          </VmStatusPopoverContent>
        </ProgressStatus>
      );
    case VM_STATUS_POD_ERROR:
      return (
        <ErrorStatus title="Pod error">
          <VmStatusPopoverContent
            message={statusDetail.message}
            linkMessage={VIEW_POD_OVERVIEW}
            linkTo={linkToPodOverview}
          />
        </ErrorStatus>
      );
    case VM_STATUS_ERROR:
      return (
        <ErrorStatus title="VM error">
          <VmStatusPopoverContent
            message={statusDetail.message}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
          >
            {additionalText}
          </VmStatusPopoverContent>
        </ErrorStatus>
      );
    case VM_STATUS_IMPORT_ERROR:
      return (
        <ErrorStatus title="Import error">
          <VmStatusPopoverContent
            message={IMPORTING_ERROR_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
          >
            {statusDetail.message}
            {additionalText}
          </VmStatusPopoverContent>
        </ErrorStatus>
      );
    case VM_STATUS_IMPORTING:
      return (
        <ProgressStatus title="Importing">
          <VmStatusPopoverContent
            message={IMPORTING_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
            progress={statusDetail.progress}
          >
            {additionalText}
          </VmStatusPopoverContent>
        </ProgressStatus>
      );
    case VM_STATUS_VMI_WAITING:
      return (
        <PendingStatus title="Pending">
          <VmStatusPopoverContent
            message={VMI_WAITING_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
          >
            {statusDetail.message}
          </VmStatusPopoverContent>
        </PendingStatus>
      );

    case VM_STATUS_STARTING:
      return (
        <ProgressStatus title="Starting">
          <VmStatusPopoverContent
            message={STARTING_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
            progress={statusDetail.progress}
          >
            {statusDetail.message}
          </VmStatusPopoverContent>
        </ProgressStatus>
      );
    case VM_STATUS_MIGRATING:
      return (
        <ProgressStatus title="Migrating">
          <VmStatusPopoverContent
            message={statusDetail.message}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
            progress={statusDetail.progress}
          />
        </ProgressStatus>
      );
    case VM_STATUS_RUNNING:
      return <SuccessStatus title="Running" />;
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

type VmStatusPopoverContentProps = {
  message: string;
  children?: React.ReactNode;
  progress?: number;
  linkTo?: string;
  linkMessage?: string;
};

type VmStatusProps = {
  vm: VMKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
  verbose?: boolean;
};
