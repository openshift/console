import * as React from 'react';
import { Alert, Stack, StackItem } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { AsyncComponent, HandlePromiseProps, withHandlePromise } from '../utils';
import { getName, YellowExclamationTriangleIcon } from '@console/shared';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '../factory';
import { k8sKill, PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { PersistentVolumeClaimModel } from '../../models';
import { isPVCDelete, PVCDelete, useExtensions } from '@console/plugin-sdk';

const DeletePVCModal = withHandlePromise<DeletePVCModalProps>((props) => {
  const { pvc, inProgress, errorMessage, handlePromise, close, cancel } = props;
  const pvcDeleteExtensions = useExtensions<PVCDelete>(isPVCDelete);
  const pvcName = getName(pvc);
  const { t } = useTranslation();

  const submit = (e) => {
    e.preventDefault();

    const promise = k8sKill(PersistentVolumeClaimModel, pvc);
    const extensionPromises = pvcDeleteExtensions.map(
      ({ properties: { predicate, onPVCKill } }) => predicate(pvc) && onPVCKill(pvc),
    );
    return handlePromise(Promise.all([promise, ...extensionPromises]), close);
  };

  const alertComponents = pvcDeleteExtensions.map(
    ({ properties: { predicate, alert }, uid }) =>
      predicate(pvc) && (
        <StackItem key={uid}>
          <Alert className="co-m-form-row" isInline variant={alert?.type} title={alert?.title}>
            <AsyncComponent loader={alert?.body} pvc={pvc} />
          </Alert>
        </StackItem>
      ),
  );

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
        {t('public~Delete PersistentVolumeClaim')}
      </ModalTitle>
      <ModalBody>
        <Stack hasGutter>
          {alertComponents}
          <StackItem>
            <Trans t={t} ns="public">
              Are you sure you want to delete{' '}
              <strong className="co-break-word">{{ pvcName }}</strong> PersistentVolumeClaim?
            </Trans>
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('public~Delete')}
        submitDanger
        cancel={cancel}
      />
    </form>
  );
});

export type DeletePVCModalProps = {
  pvc: PersistentVolumeClaimKind;
} & ModalComponentProps &
  HandlePromiseProps;

export default createModalLauncher(DeletePVCModal);
