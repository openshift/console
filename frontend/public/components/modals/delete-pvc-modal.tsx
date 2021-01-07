import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { HandlePromiseProps, withHandlePromise } from '../utils';
import { getName, YellowExclamationTriangleIcon } from '@console/shared';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import { isPVCDelete, PVCDelete } from '@console/dynamic-plugin-sdk/src/extensions/pvc';
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
import { useTranslation, Trans } from 'react-i18next';

const DeletePVCModal = withHandlePromise<DeletePVCModalProps>((props) => {
  const { pvc, inProgress, errorMessage, handlePromise, close, cancel } = props;
  const [pvcDeleteExtensions] = useResolvedExtensions<PVCDelete>(isPVCDelete);
  const pvcName = getName(pvc);
  const { t } = useTranslation();

  const submit = (e) => {
    e.preventDefault();

    const promise = k8sKill(PersistentVolumeClaimModel, pvc);
    const extensionPromises = pvcDeleteExtensions.map(
      ({ properties: { predicate, onPVCKill } }) =>
        predicate(pvcMetadata) && onPVCKill(pvcMetadata),
    );
    return handlePromise(Promise.all([promise, ...extensionPromises]), close);
  };

  const alertComponents = pvcDeleteExtensions.map(
    ({ properties: { predicate, alert: PVCAlert }, uid }) =>
      predicate(pvcMetadata) && (
        <StackItem key={uid}>
          <PVCAlert pvc={pvcMetadata} />
        </StackItem>
      ),
  );

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>
        <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
        {t('modal~Delete PersistentVolumeClaim')}
      </ModalTitle>
      <ModalBody>
        <Stack hasGutter>
          {alertComponents}
          <StackItem>
            <Trans i18nKey="modal~deletePVCConfirm">
              Are you sure you want to delete{' '}
              <strong className="co-break-word">{{ pvcName }}</strong> PersistentVolumeClaim?
            </Trans>
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('modal~Delete')}
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
