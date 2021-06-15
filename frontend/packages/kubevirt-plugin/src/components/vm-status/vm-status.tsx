import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { ResourceLink, resourcePath } from '@console/internal/components/utils';
import { history } from '@console/internal/components/utils/router';
import { PersistentVolumeClaimModel, PodModel } from '@console/internal/models';
import { PodKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared/src';
import GenericStatus from '@console/shared/src/components/status/GenericStatus';
import {
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared/src/components/status/icons';
import {
  Button,
  ButtonVariant,
  Level,
  LevelItem,
  Progress,
  ProgressSize,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import {
  HourglassHalfIcon,
  InProgressIcon,
  OffIcon,
  PausedIcon,
  SyncAltIcon,
  UnknownIcon,
} from '@patternfly/react-icons';

import { VM_DETAIL_EVENTS_HREF } from '../../constants';
import { StatusGroup } from '../../constants/status-group';
import { VMImportType } from '../../constants/v2v-import/ovirt/vm-import-type';
import { VMStatus as VMStatusEnum } from '../../constants/vm/vm-status';
import { unpauseVMI } from '../../k8s/requests/vmi/actions';
import { VMImportWrappper } from '../../k8s/wrapper/vm-import/vm-import-wrapper';
import { getVMLikeModel } from '../../selectors/vm';
import { VMStatusBundle } from '../../statuses/vm/types';
import { VMIKind, VMKind } from '../../types';
import { VMILikeEntityKind } from '../../types/vmLike';
import { getVMTabURL } from '../../utils/url';
import { saveAndRestartModal } from '../modals/save-and-restart-modal/save-and-restart-modal';
import { VMTabURLEnum } from '../vms/types';
import { kvReferenceForModel } from '../../models/kvReferenceForModel';

import './vm-status.scss';

const getStatusSuffixLabelKey = (vmStatusBundle: VMStatusBundle) => {
  if (vmStatusBundle.status.getGroup() === StatusGroup.VMIMPORT) {
    switch (new VMImportWrappper(vmStatusBundle.vmImport).getType()) {
      case VMImportType.OVIRT:
        // t('kubevirt-plugin~RHV')
        return 'kubevirt-plugin~RHV';
      case VMImportType.VMWARE:
        // t('kubevirt-plugin~VMware')
        return 'kubevirt-plugin~VMware';
      default:
        break;
    }
  }
  return undefined;
};

export type LinkType = {
  to: string;
  action?: VoidFunction;
  message?: string;
};

export const VMStatusPopoverContent: React.FC<VMStatusPopoverContentProps> = ({
  message,
  children,
  progress,
  links,
}) => (
  <Stack hasGutter>
    {message && <StackItem>{message}</StackItem>}
    {children && <StackItem>{children}</StackItem>}
    {progress != null && (
      <StackItem>
        <Progress value={progress} size={ProgressSize.sm} />
      </StackItem>
    )}
    {!!links?.length && (
      <StackItem>
        <Level>
          {links.map(({ to, action, message: linkMessage }) => (
            <LevelItem key={to}>
              {action ? (
                <Button variant="link" isInline onClick={action}>
                  {linkMessage}
                </Button>
              ) : (
                <Link to={to} title={linkMessage}>
                  {linkMessage || to}
                </Link>
              )}
            </LevelItem>
          ))}
        </Level>
      </StackItem>
    )}
  </Stack>
);

type PendingChangesPopoverContentProps = {
  vm: VMKind;
  vmi: VMIKind;
};

// Use onMouseUp instead of onClick since PF4 popup prevents
// child components to use onClick and onMouseDown
const PendingChangesPopoverContent: React.FC<PendingChangesPopoverContentProps> = ({ vm, vmi }) => {
  const { t } = useTranslation();
  return (
    <VMStatusPopoverContent
      key="pcPopover"
      message={t(
        'kubevirt-plugin~This virtual machine has some pending changes that will apply after it is restarted.',
      )}
    >
      <Button
        key={`pcRestartBtn-${getName(vm)}`}
        className="co-modal-btn-link--inline"
        variant={ButtonVariant.secondary}
        onMouseUp={() => saveAndRestartModal(vm, vmi)}
      >
        {t('kubevirt-plugin~Restart')}
      </Button>
      <Button
        key={`pcViewDetailsBtn-${getName(vm)}`}
        variant={ButtonVariant.plain}
        onMouseUp={() => history.push(getVMTabURL(vm, VMTabURLEnum.details))}
      >
        {t('kubevirt-plugin~View Details')}
      </Button>
    </VMStatusPopoverContent>
  );
};

type ImporterPodsProps = {
  statuses: VMStatusBundle['importerPodsStatuses'];
};

export const ImporterPods: React.FC<ImporterPodsProps> = ({ statuses }) => (
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

export const VIEW_POD_LOGS = 'View Pod logs';
export const VIEW_VM_EVENTS = 'View VM events';

export const getPodLink = (pod: PodKind) =>
  `${resourcePath(PodModel.kind, getName(pod), getNamespace(pod))}`; // to default tab

export const getVMILikeLink = (vmLike: VMILikeEntityKind) =>
  `${resourcePath(
    kvReferenceForModel(getVMLikeModel(vmLike)),
    getName(vmLike),
    getNamespace(vmLike),
  )}/${VM_DETAIL_EVENTS_HREF}`;

export const getVMStatusIcon = (
  isPaused: boolean,
  status: VMStatusEnum,
  arePendingChanges: boolean,
): React.ComponentClass | React.FC => {
  let icon: React.ComponentClass | React.FC = UnknownIcon;

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

  if (arePendingChanges) {
    icon = YellowExclamationTriangleIcon;
  }

  return icon;
};

export const VMStatus: React.FC<VMStatusProps> = ({
  vm,
  vmi,
  vmStatusBundle,
  arePendingChanges,
}) => {
  const { t } = useTranslation();
  const vmiLike = vm || vmi;

  const { status, pod, progress, importerPodsStatuses } = vmStatusBundle;

  const title =
    t(status.getLabelKey()) ||
    status.toString(t(getStatusSuffixLabelKey(vmStatusBundle))) ||
    t('kubevirt-plugin~Unknown');
  const popoverTitle = arePendingChanges ? 'Pending Changes' : null;
  const message = vmStatusBundle.message || vmStatusBundle.detailedMessage;
  const detailedMessage = vmStatusBundle.message ? vmStatusBundle.detailedMessage : null;
  const isPaused = status === VMStatusEnum.PAUSED;

  const links: LinkType[] = [];

  if (vmiLike) {
    links.push({ to: getVMILikeLink(vmiLike), message: VIEW_VM_EVENTS });
  }

  if (pod) {
    links.push({ to: `${getPodLink(pod)}/logs`, message: VIEW_POD_LOGS });
  }

  const Icon = getVMStatusIcon(isPaused, status, arePendingChanges);

  return (
    <GenericStatus title={title} Icon={Icon} popoverTitle={popoverTitle}>
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
      {arePendingChanges && (
        <PendingChangesPopoverContent key="pcPopoverContent" vm={vm} vmi={vmi} />
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
  arePendingChanges?: boolean;
};
