import * as React from 'react';

import { withHandlePromise } from '@console/internal/components/utils';

import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory';

import { k8sPatch } from '@console/internal/module/k8s';

import { getPxeBootPatch } from 'kubevirt-web-ui-components';
import { getName, getNamespace } from '@console/shared/src';
import { VirtualMachineModel } from '../../models';
import { VMKind } from '../../types/vm';

const StartStopVmModal = withHandlePromise((props: StartStopVmModalProps) => {
  const { vm, start, inProgress, errorMessage, handlePromise, close, cancel } = props;

  const submit = (event) => {
    event.preventDefault();

    const patches = [];

    // handle PXE boot
    if (start) {
      const pxePatch = getPxeBootPatch(vm);
      patches.push(...pxePatch);
    }

    patches.push({
      op: 'replace',
      path: '/spec/running',
      value: start,
    });

    const promise = k8sPatch(VirtualMachineModel, vm, patches);
    return handlePromise(promise).then(close);
  };

  const action = start ? 'Start' : 'Stop';
  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>{action} Virtual Machine</ModalTitle>
      <ModalBody>
        Are you sure you want to {action.toLowerCase()} <strong>{getName(vm)}</strong> in namespace{' '}
        <strong>{getNamespace(vm)}</strong>?
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={action}
        cancel={cancel}
      />
    </form>
  );
});

export type StartStopVmModalProps = {
  vm: VMKind;
  start: boolean;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel: () => void;
  close: () => void;
};

export const startStopVmModal = createModalLauncher(StartStopVmModal);
