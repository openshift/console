import * as React from 'react';
import { AnnotationsModalProps } from '../../../api/internal-types';
import { K8sResourceCommon, getGroupVersionKindForResource, useK8sModel } from '../../../lib-core';
import { AnnotationsModal, ModalWrapper } from '../../../lib-internal';
import { ModalComponent } from '../../modal-support/ModalProvider';
import { useModal } from '../../modal-support/useModal';

type UseAnnotationsModal = (resource: K8sResourceCommon) => () => void;

const AnnotationsModalComponent: ModalComponent<AnnotationsModalProps> = ({
  closeModal,
  kind,
  resource,
}) => {
  return (
    <ModalWrapper blocking onClose={closeModal}>
      <AnnotationsModal cancel={closeModal} close={closeModal} kind={kind} resource={resource} />
    </ModalWrapper>
  );
};

/**
 * A hook for launching a modal for editing a resource's annotations.
 *
 * @hook useAnnotationsModal
 * @argument resource - The resource to edit annotations for.
 * @returns a function which will launch a modal for editing a resource's annotations.
 * @example
 * const PodAnnotationsButton = ({ pod }) => {
 *   const { t } = useTranslation();
 *   const launchAnnotationsModal = useAnnotationsModal<PodKind>(pod);
 *   return <button onClick={launchAnnotationsModal}>{t('Edit Pod Annotations')}</button>
 * }
 */
export const useAnnotationsModal: UseAnnotationsModal = (resource) => {
  const launcher = useModal();
  const groupVersionKind = getGroupVersionKindForResource(resource);
  const [kind] = useK8sModel(groupVersionKind);
  return React.useCallback(
    () =>
      resource &&
      kind &&
      launcher<AnnotationsModalProps>(AnnotationsModalComponent, { kind, resource }),
    [launcher, kind, resource],
  );
};
