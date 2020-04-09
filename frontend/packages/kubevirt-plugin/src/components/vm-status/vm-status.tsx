import * as React from 'react';
import { PodKind, K8sResourceKind } from '@console/internal/module/k8s';
import { OffIcon, PausedIcon, SyncAltIcon, UnknownIcon } from '@patternfly/react-icons';
import {
  PopoverStatus,
  StatusIconAndText,
  getNamespace,
  getName,
  ErrorStatus,
  ProgressStatus,
  PendingStatus,
} from '@console/shared';
import {
  Progress,
  ProgressVariant,
  ProgressSize,
  Button,
  ButtonVariant,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { resourcePath } from '@console/internal/components/utils';
import { PodModel } from '@console/internal/models';
import { unpauseVMI } from '../../k8s/requests/vmi/actions';
import {
  VM_DETAIL_EVENTS_HREF,
  CDI_KUBEVIRT_IO,
  STORAGE_IMPORT_PVC_NAME,
  PAUSED_VM_MODAL_MESSAGE,
} from '../../constants';
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
  VM_STATUS_STOPPING,
  VM_STATUS_OFF,
  VM_STATUS_ERROR,
  VM_STATUS_IMPORT_PENDING,
  VM_STATUS_PAUSED,
  VM_STATUS_V2V_VM_IMPORT_ERROR,
  VM_STATUS_V2V_VM_IMPORT_IN_PROGRESS,
} from '../../statuses/vm/constants';
import { VMKind, VMIKind } from '../../types';
import { getVMLikeModel } from '../../selectors/vm';

import './vm-status.scss';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';

const VIEW_POD_OVERVIEW = 'View pod overview';
const VIEW_VM_EVENTS = 'View events';
const IMPORTING_VMWARE_MESSAGE =
  'The virtual machine is being imported from VMware. Disks will be converted to the libvirt format.';
const IMPORTING_ERROR_VMWARE_MESSAGE = 'The virtual machine could not be imported from VMware.';
const IMPORTING_OVIRT_MESSAGE =
  'The virtual machine is being imported from Red Hat Virtualization.';
const IMPORTING_ERROR_OVIRT_MESSAGE =
  'The virtual machine could not be imported from Red Hat Virtualization.';
const IMPORTING_MESSAGE =
  'The virtual machine is being imported. Disks are being copied from the source image.';
const IMPORTING_ERROR_MESSAGE = 'The virtual machine could not be imported.';
const VMI_WAITING_MESSAGE = 'The virtual machine is waiting for resources to become available.';
const STARTING_MESSAGE =
  'This virtual machine will start shortly. Preparing storage, networking, and compute resources.';
const IMPORT_WAITING_MESSAGE = 'The importer pod is waiting for resources to become available.';

const getAdditionalImportText = (pod: PodKind): string => {
  const labels = getLabels(pod, {});
  const labelValue = labels[`${CDI_KUBEVIRT_IO}/${STORAGE_IMPORT_PVC_NAME}`];
  return labelValue ? `(${labelValue})` : null;
};

const VMStatusPopoverContent: React.FC<VMStatusPopoverContentProps> = ({
  message,
  children,
  progress,
  linkTo,
  linkMessage,
}) => (
  <>
    {message}
    {children && <div className="kubevirt-vm-status__detail-section">{children}</div>}
    {progress != null && (
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

export const VMStatus: React.FC<VMStatusProps> = ({
  vm,
  vmi,
  pods,
  vmImports,
  migrations,
  verbose = false,
}) => {
  const vmLike = vm || vmi;

  const statusDetail = getVMStatus({ vm, vmi, pods, migrations, vmImports });
  const linkToVMEvents = `${resourcePath(
    getVMLikeModel(vmLike).kind,
    getName(vmLike),
    getNamespace(vmLike),
  )}/${VM_DETAIL_EVENTS_HREF}`;
  const linkToPodOverview = `${resourcePath(
    PodModel.kind,
    getName(statusDetail.launcherPod),
    getNamespace(statusDetail.launcherPod),
  )}`; // to default tab
  const additionalText =
    verbose && statusDetail.pod ? getAdditionalImportText(statusDetail.pod) : null;

  const unpauseVM = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    await unpauseVMI(vmi);
  };

  switch (statusDetail.status) {
    case VM_STATUS_V2V_VM_IMPORT_ERROR:
      return (
        <ErrorStatus title="Import error (Red Hat Virtualization)">
          <VMStatusPopoverContent
            message={IMPORTING_ERROR_OVIRT_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
          >
            {statusDetail.message} {additionalText}
          </VMStatusPopoverContent>
        </ErrorStatus>
      );
    case VM_STATUS_V2V_VM_IMPORT_IN_PROGRESS:
      return (
        <ProgressStatus title="Importing (Red Hat Virtualization)">
          <VMStatusPopoverContent
            message={IMPORTING_OVIRT_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
            progress={statusDetail.progress}
          >
            {statusDetail.message} {additionalText}
          </VMStatusPopoverContent>
        </ProgressStatus>
      );
    case VM_STATUS_V2V_CONVERSION_PENDING:
      return (
        <PendingStatus title="Import pending (VMware)">
          <VMStatusPopoverContent
            message={IMPORTING_VMWARE_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
          >
            {statusDetail.message}
          </VMStatusPopoverContent>
        </PendingStatus>
      );
    case VM_STATUS_IMPORT_PENDING:
      return (
        <PendingStatus title="Import pending">
          <VMStatusPopoverContent
            message={IMPORT_WAITING_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
          >
            {statusDetail.message}
          </VMStatusPopoverContent>
        </PendingStatus>
      );
    case VM_STATUS_V2V_CONVERSION_ERROR:
      return (
        <ErrorStatus title="Import error (VMware)">
          <VMStatusPopoverContent
            message={IMPORTING_ERROR_VMWARE_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
          >
            {statusDetail.message} {additionalText}
          </VMStatusPopoverContent>
        </ErrorStatus>
      );
    case VM_STATUS_V2V_CONVERSION_IN_PROGRESS:
      return (
        <ProgressStatus title="Importing (VMware)">
          <VMStatusPopoverContent
            message={IMPORTING_VMWARE_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
            progress={statusDetail.progress}
          >
            {additionalText}
          </VMStatusPopoverContent>
        </ProgressStatus>
      );
    case VM_STATUS_POD_ERROR:
      return (
        <ErrorStatus title="Pod error">
          <VMStatusPopoverContent
            message={statusDetail.message}
            linkMessage={VIEW_POD_OVERVIEW}
            linkTo={linkToPodOverview}
          />
        </ErrorStatus>
      );
    case VM_STATUS_ERROR:
      return (
        <ErrorStatus title="VM error">
          <VMStatusPopoverContent
            message={statusDetail.message}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
          >
            {additionalText}
          </VMStatusPopoverContent>
        </ErrorStatus>
      );
    case VM_STATUS_IMPORT_ERROR:
      return (
        <ErrorStatus title="Import error">
          <VMStatusPopoverContent
            message={IMPORTING_ERROR_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
          >
            {statusDetail.message}
            {additionalText}
          </VMStatusPopoverContent>
        </ErrorStatus>
      );
    case VM_STATUS_IMPORTING:
      return (
        <ProgressStatus title="Importing">
          <VMStatusPopoverContent
            message={IMPORTING_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
            progress={statusDetail.progress}
          >
            {additionalText}
          </VMStatusPopoverContent>
        </ProgressStatus>
      );
    case VM_STATUS_VMI_WAITING:
      return (
        <PendingStatus title="Pending">
          <VMStatusPopoverContent
            message={VMI_WAITING_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
          >
            {statusDetail.message}
          </VMStatusPopoverContent>
        </PendingStatus>
      );

    case VM_STATUS_STARTING:
      return (
        <ProgressStatus title="Starting">
          <VMStatusPopoverContent
            message={STARTING_MESSAGE}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
            progress={statusDetail.progress}
          >
            {statusDetail.message}
          </VMStatusPopoverContent>
        </ProgressStatus>
      );
    case VM_STATUS_MIGRATING:
      return (
        <ProgressStatus title="Migrating">
          <VMStatusPopoverContent
            message={statusDetail.message}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
            progress={statusDetail.progress}
          />
        </ProgressStatus>
      );
    case VM_STATUS_STOPPING:
      return (
        <ProgressStatus title="Stopping">
          <VMStatusPopoverContent
            message={statusDetail.message}
            linkMessage={VIEW_VM_EVENTS}
            linkTo={linkToVMEvents}
            progress={statusDetail.progress}
          />
        </ProgressStatus>
      );
    case VM_STATUS_PAUSED:
      return (
        <PopoverStatus title="Paused" icon={<PausedIcon />}>
          <VMStatusPopoverContent message={PAUSED_VM_MODAL_MESSAGE}>
            <Button variant={ButtonVariant.primary} onClick={unpauseVM} id="paused-popover-submit">
              Unpause
            </Button>
          </VMStatusPopoverContent>
        </PopoverStatus>
      );
    case VM_STATUS_RUNNING:
      return <StatusIconAndText title="Running" icon={<SyncAltIcon />} />;
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

type VMStatusPopoverContentProps = {
  message: string;
  children?: React.ReactNode;
  progress?: number;
  linkTo?: string;
  linkMessage?: string;
};

type VMStatusProps = {
  vm: VMKind;
  vmi?: VMIKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
  vmImports?: VMImportKind[];
  verbose?: boolean;
};
