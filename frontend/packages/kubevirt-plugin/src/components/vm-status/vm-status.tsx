import * as React from 'react';
import { PodKind } from '@console/internal/module/k8s';
import {
  HourglassHalfIcon,
  InProgressIcon,
  OffIcon,
  PausedIcon,
  SyncAltIcon,
  UnknownIcon,
} from '@patternfly/react-icons';
import { getNamespace, getName } from '@console/shared/src';
import { RedExclamationCircleIcon } from '@console/shared/src/components/status/icons';
import GenericStatus from '@console/shared/src/components/status/GenericStatus';
import {
  Progress,
  ProgressVariant,
  ProgressSize,
  Button,
  ButtonVariant,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { ResourceLink, resourcePath } from '@console/internal/components/utils';
import { PersistentVolumeClaimModel, PodModel } from '@console/internal/models';
import { unpauseVMI } from '../../k8s/requests/vmi/actions';
import { VM_DETAIL_EVENTS_HREF } from '../../constants';
import { VMKind, VMIKind } from '../../types';
import { getVMLikeModel } from '../../selectors/vm';
import { VMStatus as VMStatusEnum } from '../../constants/vm/vm-status';
import { VMILikeEntityKind } from '../../types/vmLike';
import { VMStatusBundle } from '../../statuses/vm/types';

import './vm-status.scss';

type LinkType = {
  to: string;
  message?: string;
};

const VMStatusPopoverContent: React.FC<VMStatusPopoverContentProps> = ({
  message,
  children,
  progress,
  links,
}) => (
  <>
    {message}
    {children && <div className="kubevirt-vm-status__detail-section">{children}</div>}
    {progress != null && (
      <div className="kubevirt-vm-status__detail-section">
        <Progress value={progress} variant={ProgressVariant.info} size={ProgressSize.sm} />
      </div>
    )}
    {links &&
      links.map(({ to, message: linkMessage }) => (
        <div className="kubevirt-vm-status__detail-section" key={to}>
          <Link to={to} title={linkMessage}>
            {linkMessage || to}
          </Link>
        </div>
      ))}
  </>
);

type ImporterPodsProps = {
  statuses: VMStatusBundle['importerPodsStatuses'];
};

const ImporterPods: React.FC<ImporterPodsProps> = ({ statuses }) => (
  <>
    {statuses && (
      <ul>
        {statuses.map(({ message, status, progress, pod, dataVolume }) => {
          return (
            <li key={getName(pod)} className="kubevirt-vm-status__detail-section">
              {`${status.getLabel()} (${getName(dataVolume)})`}
              <ResourceLink
                className="kubevirt-vm-status__detail-small-section"
                kind={PodModel.kind}
                displayName={getName(pod)}
                name={getName(pod)}
                namespace={getNamespace(pod)}
              />
              {dataVolume && (
                <ResourceLink
                  className="kubevirt-vm-status__detail-small-section"
                  kind={PersistentVolumeClaimModel.kind}
                  name={getName(dataVolume)}
                  namespace={getNamespace(dataVolume)}
                />
              )}
              {progress != null && (
                <Progress
                  className="kubevirt-vm-status__detail-small-section"
                  value={progress}
                  variant={ProgressVariant.info}
                  size={ProgressSize.sm}
                />
              )}
              {message && <div className="kubevirt-vm-status__detail-small-section">{message}</div>}
            </li>
          );
        })}
      </ul>
    )}
  </>
);

const VIEW_POD_EVENTS = 'View pod events';
const VIEW_VM_EVENTS = 'View VM events';

const getPodLink = (pod: PodKind) =>
  `${resourcePath(PodModel.kind, getName(pod), getNamespace(pod))}`; // to default tab

const getVMILikeLink = (vmLike: VMILikeEntityKind) =>
  `${resourcePath(
    getVMLikeModel(vmLike).kind,
    getName(vmLike),
    getNamespace(vmLike),
  )}/${VM_DETAIL_EVENTS_HREF}`;

export const VMStatus: React.FC<VMStatusProps> = ({ vm, vmi, vmStatusBundle }) => {
  const vmiLike = vm || vmi;

  const { status, pod, progress, importerPodsStatuses } = vmStatusBundle;
  const title = status.toString(); // TODO status.toVerboseString() should be called to pass to popup header
  const message = vmStatusBundle.message || vmStatusBundle.detailedMessage;
  const detailedMessage = vmStatusBundle.message ? vmStatusBundle.detailedMessage : null;
  const isPaused = status === VMStatusEnum.PAUSED;

  const links: LinkType[] = [];

  if (vmiLike) {
    links.push({ to: getVMILikeLink(vmiLike), message: VIEW_VM_EVENTS });
  }

  if (pod) {
    links.push({ to: `${getPodLink(pod)}/events`, message: VIEW_POD_EVENTS });
  }

  let icon = UnknownIcon;

  if (isPaused) {
    icon = PausedIcon;
  } else if (status === VMStatusEnum.RUNNING) {
    icon = SyncAltIcon;
  } else if (status === VMStatusEnum.OFF) {
    icon = OffIcon;
  } else if (status.isError()) {
    icon = RedExclamationCircleIcon;
  } else if (status.isPending()) {
    // should be called before inProgress
    icon = HourglassHalfIcon;
  } else if (status.isInProgress()) {
    icon = InProgressIcon;
  }

  return (
    <GenericStatus title={title || VMStatusEnum.UNKNOWN.toString()} Icon={icon}>
      {(message || isPaused) && (
        <VMStatusPopoverContent key="popover" message={message} links={links} progress={progress}>
          {isPaused && (
            <Button
              key="unpause"
              variant={ButtonVariant.primary}
              onClick={async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                event.preventDefault();
                await unpauseVMI(vmi);
              }}
              id="paused-popover-submit"
            >
              Unpause
            </Button>
          )}
          {detailedMessage}
          <ImporterPods key="importerPods" statuses={importerPodsStatuses} />
        </VMStatusPopoverContent>
      )}
    </GenericStatus>
  );
};

type VMStatusPopoverContentProps = {
  message: string;
  children?: React.ReactNode;
  progress?: number;
  links?: LinkType[];
};

type VMStatusProps = {
  vm: VMKind;
  vmi?: VMIKind;
  vmStatusBundle?: VMStatusBundle;
};
