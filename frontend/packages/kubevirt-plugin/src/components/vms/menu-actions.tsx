import * as React from 'react';
import { StackItem } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import i18next from 'i18next';
import { Trans, useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { confirmModal } from '@console/internal/components/modals';
import { asAccessReview } from '@console/internal/components/utils';
import {
  K8sKind,
  K8sResourceKind,
  PersistentVolumeClaimKind,
  PodKind,
} from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { VMPrintableStatusSimpleLabel } from '../../constants/vm/vm-status';
import { restartVM, startVM, stopVM } from '../../k8s/requests/vm';
import { startVMIMigration } from '../../k8s/requests/vmi';
import { pauseVMI, unpauseVMI } from '../../k8s/requests/vmi/actions';
import { cancelMigration } from '../../k8s/requests/vmim';
import { cancelVMImport } from '../../k8s/requests/vmimport';
import { VMImportWrappper } from '../../k8s/wrapper/vm-import/vm-import-wrapper';
import { VirtualMachineInstanceMigrationModel } from '../../models';
import { getName, getNamespace } from '../../selectors';
import { getAutoRemovedOrPersistentDiskName } from '../../selectors/disks/hotplug';
import {
  isVMCreated,
  isVMExpectedRunning,
  isVMRunningOrExpectedRunning,
} from '../../selectors/vm/selectors';
import { isVMIPaused } from '../../selectors/vmi';
import { getMigrationVMIName } from '../../selectors/vmi-migration';
import { VMStatusBundle } from '../../statuses/vm/types';
import { isVMError, isVMProcessing } from '../../statuses/vm/vm-status';
import { V1alpha1DataVolume } from '../../types/api';
import { VMIKind, VMKind } from '../../types/vm';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import { cloneVMModal } from '../modals/clone-vm-modal';
import { confirmVMIModal } from '../modals/menu-actions-modals/confirm-vmi-modal';
import { deleteVMModal } from '../modals/menu-actions-modals/delete-vm-modal';
import { deleteVMIModal } from '../modals/menu-actions-modals/delete-vmi-modal';
import { RemovalDiskAlert } from '../vm-disks/RemovalDiskAlert';
import { ActionMessage } from './ActionMessage';

import './menu-actions.scss';

type ActionArgs = {
  vmi?: VMIKind;
  vmStatusBundle?: VMStatusBundle;
  sshServices?: any;
  command?: any;
};

export const VmActionFactory = {
  Start: (kindObj: K8sKind, vm: VMKind, { vmi, vmStatusBundle }: ActionArgs): Action => {
    const StartMessage: React.FC = () => {
      const name = getName(vm);
      const namespace = getNamespace(vm);
      return (
        <Trans ns="kubevirt-plugin">
          <p>
            This virtual machine will start as soon as the import has been completed. If you proceed
            you will not be able to change this option.
          </p>
          Are you sure you want to start <strong>{name}</strong> in namespace{' '}
          <strong>{namespace}</strong> after it has imported?
        </Trans>
      );
    };

    return {
      id: 'vm-action-start',
      disabled:
        isVMProcessing(vm, vmi) ||
        vmStatusBundle?.status?.isMigrating() ||
        isVMRunningOrExpectedRunning(vm, vmi) ||
        isVMIPaused(vmi),
      label: i18next.t('kubevirt-plugin~Start'),
      cta: () => {
        if (!vmStatusBundle?.status?.isImporting()) {
          startVM(vm);
        } else {
          confirmModal({
            title: i18next.t('kubevirt-plugin~ Start'),
            message: <StartMessage />,
            btnText: i18next.t('kubevirt-plugin~Start'),
            executeFn: () => startVM(vm),
          });
        }
      },
      accessReview: asAccessReview(kindObj, vm, 'patch'),
    };
  },
  Stop: (kindObj: K8sKind, vm: VMKind, { vmi, vmStatusBundle }: ActionArgs): Action => {
    return {
      id: 'vm-action-stop',
      disabled:
        (!isVMError(vm) && vmStatusBundle?.status?.isImporting()) ||
        (!isVMError(vm) && isVMProcessing(vm, vmi)) ||
        vm?.status?.printableStatus === VMPrintableStatusSimpleLabel.Stopping,
      label: i18next.t('kubevirt-plugin~Stop'),
      cta: () =>
        confirmVMIModal({
          vmi,
          title: i18next.t('kubevirt-plugin~Stop'),
          alertTitle: i18next.t('kubevirt-plugin~Stop alert'),
          message: (
            <ActionMessage obj={vm} action={i18next.t('kubevirt-plugin~stop')}>
              <StackItem>
                <RemovalDiskAlert
                  hotplugDiskNames={getAutoRemovedOrPersistentDiskName(vm, vmi, true)}
                />
              </StackItem>
            </ActionMessage>
          ),
          btnTextKey: i18next.t('kubevirt-plugin~Stop'),
          executeFn: () => stopVM(vm),
        }),
      accessReview: asAccessReview(kindObj, vm, 'patch'),
    };
  },
  Restart: (kindObj: K8sKind, vm: VMKind, { vmi, vmStatusBundle }: ActionArgs): Action => {
    return {
      id: 'vm-action-restart',
      label: i18next.t('kubevirt-plugin~Restart'),
      disabled:
        (!isVMError(vm) && isVMProcessing(vm, vmi)) ||
        vmStatusBundle?.status?.isImporting() ||
        vmStatusBundle?.status?.isMigrating() ||
        (!isVMError(vm) && !isVMExpectedRunning(vm, vmi)) ||
        (!isVMError(vm) && !isVMCreated(vm)),
      cta: () =>
        confirmVMIModal({
          vmi,
          title: i18next.t('kubevirt-plugin~Restart'),
          alertTitle: i18next.t('kubevirt-plugin~Restart alert'),
          message: (
            <ActionMessage obj={vm} action={i18next.t('kubevirt-plugin~restart')}>
              <StackItem>
                <RemovalDiskAlert
                  hotplugDiskNames={getAutoRemovedOrPersistentDiskName(vm, vmi, true)}
                />
              </StackItem>
            </ActionMessage>
          ),
          btnText: i18next.t('kubevirt-plugin~Restart'),
          executeFn: () => restartVM(vm),
        }),
      accessReview: asAccessReview(kindObj, vm, 'patch'),
    };
  },
  Pause: (kindObj: K8sKind, vm: VMKind, { vmi, vmStatusBundle }: ActionArgs): Action => {
    return {
      id: 'vm-action-pause',
      label: i18next.t('kubevirt-plugin~Pause'),
      disabled:
        (!isVMError(vm) && isVMProcessing(vm, vmi)) ||
        isVMIPaused(vmi) ||
        !isVMRunningOrExpectedRunning(vm, vmi) ||
        vmStatusBundle?.status?.isImporting(),
      cta: () =>
        confirmModal({
          title: i18next.t('kubevirt-plugin~Pause'),
          message: <ActionMessage obj={vmi} action={i18next.t('kubevirt-plugin~pause')} />,
          btnText: i18next.t('kubevirt-plugin~Pause'),
          executeFn: () => pauseVMI(vmi),
        }),
      accessReview: asAccessReview(kindObj, vm, 'patch'),
    };
  },
  Unpause: (kindObj: K8sKind, vm: VMKind, { vmi }: ActionArgs): Action => {
    return {
      id: 'vm-action-unpause',
      label: i18next.t('kubevirt-plugin~Resume'),
      disabled: !isVMIPaused(vmi),
      cta: () =>
        confirmModal({
          title: i18next.t('kubevirt-plugin~Resume'),
          message: <ActionMessage obj={vmi} action={i18next.t('kubevirt-plugin~unpause')} />,
          btnText: i18next.t('kubevirt-plugin~Resume'),
          executeFn: () => unpauseVMI(vmi),
        }),
    };
  },
  Migrate: (kindObj: K8sKind, vm: VMKind, { vmi, vmStatusBundle }: ActionArgs): Action => {
    const MigrateMessage: React.FC = () => {
      const name = getName(vmi);
      return (
        <Trans ns="kubevirt-plugin">
          Do you wish to migrate <strong>{name}</strong> vmi to another node?
        </Trans>
      );
    };

    return {
      id: 'vm-action-migrate',
      label: i18next.t('kubevirt-plugin~Migrate Node to Node'),
      disabled:
        isVMProcessing(vm, vmi) ||
        isVMIPaused(vmi) ||
        !!isVMError(vm) ||
        vmStatusBundle?.status?.isMigrating() ||
        vmStatusBundle?.status?.isError() ||
        vmStatusBundle?.status?.isInProgress() ||
        !isVMRunningOrExpectedRunning(vm, vmi),
      cta: () =>
        confirmModal({
          title: i18next.t('kubevirt-plugin~Migrate Node to Node'),
          message: <MigrateMessage />,
          btnText: i18next.t('kubevirt-plugin~Migrate Node to Node'),
          executeFn: () => startVMIMigration(vmi),
        }),
      accessReview: asAccessReview(kindObj, vm, 'patch'),
    };
  },
  CancelMigration: (kindObj: K8sKind, vm: VMKind, { vmStatusBundle }: ActionArgs): Action => {
    const migration = vmStatusBundle?.migration;
    const CancelMigrationMessage: React.FC = () => {
      const name = getMigrationVMIName(migration);
      const namespace = getNamespace(migration);
      return (
        <Trans ns="kubevirt-plugin">
          Are you sure you want to cancel <strong>{name}</strong> migration in{' '}
          <strong>{namespace}</strong> namespace?
        </Trans>
      );
    };

    return {
      id: 'vm-action-cancel-migration',
      label: i18next.t('kubevirt-plugin~Cancel Virtual Machine Migration'),
      disabled: isVMProcessing(vm) || !vmStatusBundle?.status?.isMigrating(),
      cta: () =>
        confirmModal({
          title: i18next.t('kubevirt-plugin~Cancel Virtual Machine Migration'),
          message: <CancelMigrationMessage />,
          btnText: i18next.t('kubevirt-plugin~Cancel Migration'),
          executeFn: () => cancelMigration(migration),
        }),
      accessReview:
        migration && asAccessReview(VirtualMachineInstanceMigrationModel, migration, 'delete'),
    };
  },
  Clone: (kindObj: K8sKind, vm: VMKind, { vmi, vmStatusBundle }: ActionArgs): Action => {
    return {
      id: 'vm-action-clone',
      label: i18next.t('kubevirt-plugin~Clone'),
      disabled: isVMProcessing(vm, vmi) || !!isVMError(vm) || vmStatusBundle?.status?.isImporting(),
      cta: () => cloneVMModal({ vm, vmi }),
      accessReview: asAccessReview(kindObj, vm, 'patch'),
    };
  },
  OpenConsole: (kindObj: K8sKind, vm: VMKind, { vmi }: ActionArgs): Action => {
    return {
      id: 'vm-action-open-console',
      label: i18next.t('kubevirt-plugin~Open Console'),
      icon: <ExternalLinkAltIcon />,
      disabled:
        isVMProcessing(vm, vmi) ||
        isVMIPaused(vmi) ||
        !!isVMError(vm) ||
        (!isVMRunningOrExpectedRunning(vm, vmi) && !isVMIPaused(vmi)),
      cta: () =>
        window.open(
          `/k8s/ns/${getNamespace(vmi)}/virtualmachineinstances/${getName(vmi)}/standaloneconsole`,
          `${getName(vmi)}-console}`,
          'modal=yes,alwaysRaised=yes,location=yes,width=1024,height=768',
        ),
    };
  },
  Delete: (kindObj: K8sKind, vm: VMKind, { vmi }: ActionArgs): Action => ({
    id: 'vm-action-delete',
    label: i18next.t('kubevirt-plugin~Delete Virtual Machine'),
    cta: () =>
      deleteVMModal({
        vm,
        vmi,
      }),
    accessReview: asAccessReview(kindObj, vm, 'delete'),
  }),
};

export const VmiActionFactory = {
  Delete: (kindObj: K8sKind, vmi: VMIKind): Action => ({
    id: 'vmi-action-delete',
    label: i18next.t('kubevirt-plugin~Delete Virtual Machine Instance'),
    cta: () =>
      deleteVMIModal({
        vmi,
      }),
    accessReview: asAccessReview(kindObj, vmi, 'delete'),
  }),
};

export const VmImportActionFactory = {
  Delete: (kindObj: K8sKind, vmimport: VMImportKind, innerArgs?: { vm?: VMKind }): Action => {
    const vmName = new VMImportWrappper(vmimport).getResolvedVMTargetName();
    const DeleteVMImportTitle: React.FC = () => {
      const { t } = useTranslation();
      return (
        <>
          <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
          {t('kubevirt-plugin~Cancel Import?')}
        </>
      );
    };

    const vmElem = <strong className="co-break-word">{vmName}</strong>;
    const vmImportElem = <strong className="co-break-word">{getName(vmimport)}</strong>;
    const nsElem = <strong className="co-break-word">{getNamespace(vmimport)}</strong>;

    const DeleteVMImportMessage: React.FC = () => {
      const { t } = useTranslation();
      return innerArgs?.vm ? (
        <>
          {t(
            'kubevirt-plugin~Are you sure you want to cancel importing {{vmImportElem}}? It will also delete the newly created {{vmElem}} in the {{nsElem}} namespace.',
            { vmImportElem, vmElem, nsElem },
          )}
        </>
      ) : (
        <>
          {t(
            'kubevirt-plugin~Are you sure you want to cancel importing {{vmImportElem}} in the {{nsElem}} namespace?',
            { vmImportElem, nsElem },
          )}
        </>
      );
    };

    return {
      id: 'vm-import-action-delete',
      label: i18next.t('kubevirt-plugin~Cancel Import'),
      cta: () =>
        confirmModal({
          title: <DeleteVMImportTitle />,
          message: <DeleteVMImportMessage />,
          submitDanger: true,
          btnText: i18next.t('kubevirt-plugin~Cancel Import'),
          executeFn: () => cancelVMImport(vmimport, innerArgs?.vm),
        }),
      accessReview: asAccessReview(kindObj, vmimport, 'delete'),
    };
  },
};

export type ExtraResources = {
  vmis: VMIKind[];
  pods: PodKind[];
  migrations: K8sResourceKind[];
  pvcs?: PersistentVolumeClaimKind[];
  dataVolumes: V1alpha1DataVolume[];
  vmImports: VMImportKind[];
};
