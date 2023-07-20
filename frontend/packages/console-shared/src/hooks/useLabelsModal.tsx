import * as React from 'react';
import { ModalComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/ModalProvider';
import { useModal } from '@console/dynamic-plugin-sdk/src/app/modal-support/useModal';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { ModalWrapper } from '@console/internal/components/factory/modal';
import { LabelsModal, LabelsModalProps } from '@console/internal/components/modals/labels-modal';

type UseLabelsModal = (resource: K8sResourceCommon) => () => void;

const LabelsModalComponent: ModalComponent<LabelsModalProps> = ({ closeModal, kind, resource }) => {
  return (
    <ModalWrapper blocking onClose={closeModal}>
      <LabelsModal cancel={closeModal} close={closeModal} kind={kind} resource={resource} />
    </ModalWrapper>
  );
};

/**
 * A hook for launching a modal for editing a resource's Labels.
 *
 * @hook useLabelsModal
 * @argument resource - The resource to edit Labels for.
 * @returns a function which will launch a modal for editing a resource's Labels.
 * @example
 * const PodLabelsButton = ({ pod }) => {
 *   const { t } = useTranslation();
 *   const launchLabelsModal = useLabelsModal<PodKind>(pod);
 *   return <button onClick={launchLabelsModal}>{t('Edit Pod Labels')}</button>
 * }
 */
export const useLabelsModal: UseLabelsModal = (resource) => {
  const launcher = useModal();
  const groupVersionKind = getGroupVersionKindForResource(resource);
  const [kind] = useK8sModel(groupVersionKind);
  return React.useCallback(
    () => resource && kind && launcher<LabelsModalProps>(LabelsModalComponent, { kind, resource }),
    [launcher, kind, resource],
  );
};
