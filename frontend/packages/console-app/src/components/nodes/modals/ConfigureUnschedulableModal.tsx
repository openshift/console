import type { FC } from 'react';
import { useState, useMemo } from 'react';
import {
  Button,
  Content,
  ContentVariants,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type { NodeKind } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import { isNodeUnschedulable } from '@console/shared/src/selectors/node';
import type { ModalComponentProps } from '@console/shared/src/types/modal';
import { markNodesUnschedulable } from '../nodeSchedulingActions';

type ConfigureUnschedulableModalProps = {
  /** Single node or array of nodes to mark as unschedulable */
  resource?: NodeKind;
  /** Array of nodes to mark as unschedulable (for bulk operations) */
  nodes?: NodeKind[];
  /** Callback invoked after successful operation */
  onComplete?: () => void;
} & ModalComponentProps;

const ConfigureUnschedulableModal: FC<ConfigureUnschedulableModalProps> = ({
  resource,
  nodes,
  onComplete,
  close,
  cancel,
}) => {
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const { t } = useTranslation('console-app');

  // Support both single node (resource) and multiple nodes (nodes array)
  const targetNodes = useMemo(() => {
    if (nodes) {
      return nodes;
    }
    if (resource) {
      return [resource];
    }
    return [];
  }, [resource, nodes]);

  // Filter nodes that will actually be affected (not already unschedulable)
  const nodesToMark = useMemo(() => targetNodes.filter((node) => !isNodeUnschedulable(node)), [
    targetNodes,
  ]);

  const isBulk = targetNodes.length > 1;

  const handleSubmit = (): void => {
    handlePromise(markNodesUnschedulable(targetNodes))
      .then(() => {
        onComplete?.();
        close();
      })
      // Errors are surfaced by usePromiseHandler/ModalFooterWithAlerts
      .catch(() => {});
  };

  return (
    <>
      <ModalHeader
        title={t('Mark as unschedulable')}
        labelId="configure-unschedulable-modal-title"
      />
      <ModalBody>
        {isBulk && (
          <Content component={ContentVariants.p}>
            <Trans ns="console-app" i18nKey="Mark <1>{{count}}</1> nodes as unschedulable?">
              Mark <strong>{{ count: nodesToMark.length }}</strong> nodes as unschedulable?
            </Trans>
          </Content>
        )}
        <Content component={ContentVariants.p}>
          {isBulk
            ? t(
                "console-app~Unschedulable nodes won't accept new pods. By blocking new pod assignments, you can isolate nodes to perform maintenance or decommission them without disrupting new traffic.",
              )
            : t(
                "console-app~Unschedulable nodes won't accept new pods. By blocking new pod assignments, you can isolate a node to perform maintenance or decommission it without disrupting new traffic.",
              )}
        </Content>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="button"
          variant="primary"
          onClick={handleSubmit}
          isLoading={inProgress}
          isDisabled={inProgress}
        >
          {t('Mark unschedulable')}
        </Button>
        <Button variant="link" onClick={cancel}>
          {t('Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export const ConfigureUnschedulableModalOverlay: OverlayComponent<ConfigureUnschedulableModalProps> = (
  props,
) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    props.closeOverlay();
  };

  return isOpen ? (
    <Modal
      variant={ModalVariant.small}
      isOpen
      onClose={handleClose}
      aria-labelledby="configure-unschedulable-modal-title"
    >
      <ConfigureUnschedulableModal {...props} cancel={handleClose} close={handleClose} />
    </Modal>
  ) : null;
};
