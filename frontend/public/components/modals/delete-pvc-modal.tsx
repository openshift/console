import * as React from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Stack, StackItem } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { HandlePromiseProps, withHandlePromise, resourceListPathFromModel } from '../utils';
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

const DeletePVCModal = withHandlePromise<DeletePVCModalProps>((props) => {
  const { pvc, inProgress, errorMessage, handlePromise, close, cancel } = props;
  const [pvcDeleteExtensions] = useResolvedExtensions<PVCDelete>(isPVCDelete);
  const pvcName = getName(pvc);
  const { t } = useTranslation();
  const pvcMetadata = { metadata: { ...pvc?.metadata } };
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();

    const promise = k8sKill(PersistentVolumeClaimModel, pvc);
    const extensionPromises = pvcDeleteExtensions.map(
      ({ properties: { predicate, onPVCKill } }) =>
        predicate(pvcMetadata) && onPVCKill(pvcMetadata),
    );

    handlePromise(Promise.all([promise, ...extensionPromises]), () => {
      close();
      // Redirect to resourcce list page if the resouce is deleted.
      navigate(resourceListPathFromModel(PersistentVolumeClaimModel, pvc.metadata.namespace));
    });
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
