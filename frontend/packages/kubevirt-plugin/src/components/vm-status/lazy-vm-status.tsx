import * as React from 'react';
import { Button, ButtonVariant, Skeleton } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { GenericStatus } from '@console/dynamic-plugin-sdk';
import {
  VMStatus,
  VMStatus as VMStatusEnum,
  VMStatusSimpleLabel,
} from '../../constants/vm/vm-status';
import { useDeepCompareMemoize } from '../../hooks/use-deep-compare-memoize';
import { unpauseVMI } from '../../k8s/requests/vmi/actions';
import { VMStatusBundle } from '../../statuses/vm/types';
import { getVMConditionsStatus } from '../../statuses/vm/vm-status';
import { VMIKind, VMKind } from '../../types';
import { hasPendingChanges } from '../../utils/pending-changes';
import { VmStatusResourcesValue } from './use-vm-status-resources';
import {
  getVMILikeLink,
  getStatusSuffixLabelKey,
  VMStatusPopoverContent,
  PendingChangesPopoverContent,
  ImporterPods,
  VIEW_POD_LOGS,
  VIEW_VM_EVENTS,
  getPodLink,
  getVMStatusIcon,
  LinkType,
} from './vm-status';

import './vm-status.scss';

const PendingChanges: React.FC = () => {
  const { t } = useTranslation();
  return <div className="kv-vm-row_status-extra-label">{t('kubevirt-plugin~Pending changes')}</div>;
};

export const LazyVMStatus: React.FC<LazyVMStatusProps> = ({
  vm,
  vmi,
  vmStatusResources,
  printableStatus,
}) => {
  const { t } = useTranslation();
  const vmiLike = vm || vmi;
  const { pods, migrations, pvcs, dvs, loaded } = vmStatusResources;

  const vmStatus = useDeepCompareMemoize(
    loaded
      ? getVMConditionsStatus({ vm, vmi, pods, migrations, dataVolumes: dvs, pvcs })
      : ({} as VMStatusBundle),
  );

  if (!loaded) {
    return <Skeleton screenreaderText="Loading status" />;
  }

  const { status, pod, progress, importerPodsStatuses } = vmStatus;

  if (
    status === VMStatus.UNKNOWN ||
    printableStatus === VMStatusSimpleLabel.Stopping ||
    printableStatus === VMStatusSimpleLabel.Stopped
  ) {
    return <>-</>;
  }

  const message = vmStatus?.message || vmStatus?.detailedMessage;
  const detailedMessage = vmStatus?.message ? vmStatus?.detailedMessage : null;
  const title = t(status?.getLabelKey()) || status?.toString(t(getStatusSuffixLabelKey(vmStatus)));
  const arePendingChanges = hasPendingChanges(vm, vmi);
  const popoverTitle = arePendingChanges ? 'Pending Changes' : null;

  const isPaused = status === VMStatusEnum.PAUSED;

  const links: LinkType[] = [];

  if (vmiLike) {
    links.push({ to: getVMILikeLink(vmiLike), message: VIEW_VM_EVENTS });
  }

  if (pod) {
    links.push({ to: `${getPodLink(pod)}/logs`, message: VIEW_POD_LOGS });
  }

  const Icon = status && getVMStatusIcon(status, arePendingChanges);

  return (
    <>
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
      {arePendingChanges && <PendingChanges />}
    </>
  );
};

type LazyVMStatusProps = {
  vm: VMKind;
  vmi?: VMIKind;
  printableStatus?: string;
  vmStatusResources: VmStatusResourcesValue;
};
