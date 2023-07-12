import * as React from 'react';
import { ModalComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/ModalProvider';
import { useModal } from '@console/dynamic-plugin-sdk/src/app/modal-support/useModal';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { ModalWrapper } from '@console/internal/components/factory/modal';
import { AnnotationsModal, AnnotationsModalProps } from '@console/internal/components/modals/tags';

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
