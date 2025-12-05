import { useNavigate } from 'react-router-dom-v5-compat';
import { Stack, StackItem } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { resourceListPathFromModel } from '../utils/resource-link';
import { getName } from '@console/shared/src/selectors/common';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
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
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

const DeletePVCModal = (props: DeletePVCModalProps) => {
  const { pvc, close, cancel } = props;
  const [pvcDeleteExtensions] = useResolvedExtensions<PVCDelete>(isPVCDelete);
  const pvcName = getName(pvc);
  const { t } = useTranslation();
  const pvcMetadata = { metadata: { ...pvc?.metadata } };
  const navigate = useNavigate();
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const submit = (e) => {
    e.preventDefault();

    const promise = k8sKill(PersistentVolumeClaimModel, pvc);
    const extensionPromises = pvcDeleteExtensions.map(
      ({ properties: { predicate, onPVCKill } }) =>
        predicate(pvcMetadata) && onPVCKill(pvcMetadata),
    );

    handlePromise(Promise.all([promise, ...extensionPromises])).then(() => {
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
};

export type DeletePVCModalProps = {
  pvc: PersistentVolumeClaimKind;
} & ModalComponentProps;

export default createModalLauncher(DeletePVCModal);
