import * as React from 'react';
import { StackItem } from '@patternfly/react-core';
import {
  DesktopIcon,
  PlayIcon,
  OffIcon,
  PowerOffIcon,
  PauseIcon,
  UndoIcon,
} from '@patternfly/react-icons';
import i18next from 'i18next';
import { Trans, useTranslation } from 'react-i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { confirmModal } from '@console/internal/components/modals';
import { asAccessReview } from '@console/internal/components/utils';
import { K8sKind } from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { restartVM, startVM, stopVM } from '../../k8s/requests/vm';
import { startVMIMigration } from '../../k8s/requests/vmi';
import { pauseVMI, unpauseVMI } from '../../k8s/requests/vmi/actions';
import { cancelMigration } from '../../k8s/requests/vmim';
import { cancelVMImport } from '../../k8s/requests/vmimport';
import { VMImportWrappper } from '../../k8s/wrapper/vm-import/vm-import-wrapper';
import { VirtualMachineInstanceMigrationModel } from '../../models';
import { getName, getNamespace } from '../../selectors';
import {
  getAutoRemovedOrPersistentDiskName,
  getHotplugDiskNames,
} from '../../selectors/disks/hotplug';
import {
  isVMCreated,
  isVMExpectedRunning,
  isVMRunningOrExpectedRunning,
} from '../../selectors/vm/selectors';
import { isVMIPaused, isVMIRunning } from '../../selectors/vmi';
import { getMigrationVMIName } from '../../selectors/vmi-migration';
import { VMStatusBundle } from '../../statuses/vm/types';
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

const startAction = (kindObj: K8sKind, vm: VMKind, { vmi, vmStatusBundle }: ActionArgs): Action => {
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
    disabled: vmStatusBundle?.status?.isMigrating() || isVMRunningOrExpectedRunning(vm, vmi),
    label: i18next.t('kubevirt-plugin~Start Virtual Machine'),
    icon: <PowerOffIcon />,
    cta: () => {
      if (!vmStatusBundle?.status?.isImporting()) {
        startVM(vm);
      } else {
        confirmModal({
          title: i18next.t('kubevirt-plugin~ Start Virtual Machine'),
          message: <StartMessage />,
          btnText: i18next.t('kubevirt-plugin~Start'),
          executeFn: () => startVM(vm),
        });
      }
    },
    accessReview: asAccessReview(kindObj, vm, 'patch'),
  };
};

const stopAction = (kindObj: K8sKind, vm: VMKind, { vmi, vmStatusBundle }: ActionArgs): Action => {
  return {
    id: 'vm-action-stop',
    disabled: !isVMRunningOrExpectedRunning(vm, vmi) || vmStatusBundle?.status?.isImporting(),
    label: i18next.t('kubevirt-plugin~Stop Virtual Machine'),
    icon: <OffIcon />,
    cta: () =>
      confirmVMIModal({
        vmi,
        title: i18next.t('kubevirt-plugin~Stop Virtual Machine'),
        alertTitle: i18next.t('kubevirt-plugin~Stop Virtual Machine alert'),
        message: (
          <ActionMessage obj={vm} action={i18next.t('kubevirt-plugin~stop')}>
            <StackItem>
              <RemovalDiskAlert
                hotplugDiskNames={getAutoRemovedOrPersistentDiskName(
                  vm,
                  getHotplugDiskNames(vmi),
                  true,
                )}
              />
            </StackItem>
          </ActionMessage>
        ),
        btnTextKey: i18next.t('kubevirt-plugin~Stop'),
        executeFn: () => stopVM(vm),
      }),
    accessReview: asAccessReview(kindObj, vm, 'patch'),
  };
};

const pauseAction = (kindObj: K8sKind, vm: VMKind, { vmi }: ActionArgs): Action => {
  return {
    id: 'vm-action-pause',
    label: i18next.t('kubevirt-plugin~Pause Virtual Machine'),
    disabled: isVMIPaused(vmi),
    icon: <PauseIcon />,
    cta: () =>
      confirmModal({
        title: i18next.t('kubevirt-plugin~Pause Virtual Machine'),
        message: <ActionMessage obj={vmi} action={i18next.t('kubevirt-plugin~pause')} />,
        btnText: i18next.t('kubevirt-plugin~Pause'),
        executeFn: () => pauseVMI(vmi),
      }),
  };
};

const unpauseAction = (kindObj: K8sKind, vm: VMKind, { vmi }: ActionArgs): Action => {
  return {
    id: 'vm-action-unpause',
    label: i18next.t('kubevirt-plugin~Unpause Virtual Machine'),
    disabled: !isVMIPaused(vmi),
    icon: <PlayIcon />,
    cta: () =>
      confirmModal({
        title: i18next.t('kubevirt-plugin~Unpause Virtual Machine'),
        message: <ActionMessage obj={vmi} action={i18next.t('kubevirt-plugin~unpause')} />,
        btnText: i18next.t('kubevirt-plugin~Unpause'),
        executeFn: () => unpauseVMI(vmi),
      }),
  };
};

const migrateAction = (
  kindObj: K8sKind,
  vm: VMKind,
  { vmi, vmStatusBundle }: ActionArgs,
): Action => {
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
    label: i18next.t('kubevirt-plugin~Migrate Virtual Machine'),
    disabled:
      vmStatusBundle?.status?.isMigrating() ||
      vmStatusBundle?.status?.isError() ||
      vmStatusBundle?.status?.isInProgress() ||
      !isVMRunningOrExpectedRunning(vm, vmi),
    cta: () =>
      confirmModal({
        title: i18next.t('kubevirt-plugin~Migrate Virtual Machine'),
        message: <MigrateMessage />,
        btnText: i18next.t('kubevirt-plugin~Migrate'),
        executeFn: () => startVMIMigration(vmi),
      }),
  };
};

const cancelMigrationAction = (
  kindObj: K8sKind,
  vm: VMKind,
  { vmStatusBundle }: ActionArgs,
): Action => {
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
    disabled: !vmStatusBundle?.status?.isMigrating(),
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
};

export const VmActionFactory = {
  Start: (kindObj: K8sKind, vm: VMKind, { vmi, vmStatusBundle }: ActionArgs): Action =>
    !isVMRunningOrExpectedRunning(vm, vmi)
      ? startAction(kindObj, vm, { vmi, vmStatusBundle })
      : stopAction(kindObj, vm, { vmi, vmStatusBundle }),
  Restart: (kindObj: K8sKind, vm: VMKind, { vmi, vmStatusBundle }: ActionArgs): Action => {
    return {
      id: 'vm-action-restart',
      label: i18next.t('kubevirt-plugin~Restart Virtual Machine'),
      disabled:
        vmStatusBundle?.status?.isImporting() ||
        vmStatusBundle?.status?.isMigrating() ||
        !isVMExpectedRunning(vm, vmi) ||
        isVMIPaused(vmi) ||
        !isVMCreated(vm),
      icon: <UndoIcon />,
      cta: () =>
        confirmVMIModal({
          vmi,
          title: i18next.t('kubevirt-plugin~Restart Virtual Machine'),
          alertTitle: i18next.t('kubevirt-plugin~Restart Virtual Machine alert'),
          message: (
            <ActionMessage obj={vm} action={i18next.t('kubevirt-plugin~restart')}>
              <StackItem>
                <RemovalDiskAlert
                  hotplugDiskNames={getAutoRemovedOrPersistentDiskName(
                    vm,
                    getHotplugDiskNames(vmi),
                    true,
                  )}
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
  Pause: (kindObj: K8sKind, vm: VMKind, { vmi }: ActionArgs): Action =>
    !vmi || !isVMIPaused(vmi)
      ? pauseAction(kindObj, vm, { vmi })
      : unpauseAction(kindObj, vm, { vmi }),
  Migrate: (kindObj: K8sKind, vm: VMKind, { vmi, vmStatusBundle }: ActionArgs): Action =>
    !vmStatusBundle || !vmStatusBundle?.status?.isMigrating()
      ? migrateAction(kindObj, vm, { vmi })
      : cancelMigrationAction(kindObj, vm, { vmStatusBundle }),
  Clone: (kindObj: K8sKind, vm: VMKind, { vmi, vmStatusBundle }: ActionArgs): Action => {
    return {
      id: 'vm-action-clone',
      label: i18next.t('kubevirt-plugin~Clone Virtual Machine'),
      disabled: vmStatusBundle?.status?.isImporting(),
      cta: () => cloneVMModal({ vm, vmi }),
      accessReview: asAccessReview(kindObj, vm, 'patch'),
    };
  },
  OpenConsole: (kindObj: K8sKind, vm: VMKind, { vmi }: ActionArgs): Action => {
    return {
      id: 'vm-action-open-console',
      label: i18next.t('kubevirt-plugin~Open Console'),
      icon: <DesktopIcon />,
      disabled: !isVMIRunning(vmi) && !isVMIPaused(vmi),
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
            'kubevirt-plugin~Are you sure you want to cancel importing {{vmImportElem}}? It will also delete the newly created {{vmElem}} in the {{nsElem}} namespace?',
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
