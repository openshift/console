import { useState, useCallback } from 'react';
import {
  Button,
  Modal,
  ModalHeader,
  ModalVariant,
  ModalBody,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/lib-core';
import { getNamespace } from '@console/internal/components/utils/link';
import type { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { k8sKill } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import {
  ALL_NAMESPACES_KEY,
  LAST_NAMESPACE_NAME_USER_PREFERENCE_KEY,
} from '@console/shared/src/constants/common';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import type { ModalComponentProps } from '@console/shared/src/types/modal';
import { formatNamespaceRoute } from '../../actions/ui';

const DeleteNamespaceModal: OverlayComponent<DeleteNamespaceModalProps> = ({
  kind,
  resource,
  closeOverlay,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation('public');
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const [confirmed, setConfirmed] = useState(false);

  const [, setLastNamespace] = useUserPreference<string>(LAST_NAMESPACE_NAME_USER_PREFERENCE_KEY);

  const onSubmit = (event) => {
    event.preventDefault();
    handlePromise(k8sKill(kind, resource))
      .then(() => {
        const activeNamespace = getNamespace(window.location.pathname);
        if (resource.metadata.name === activeNamespace) {
          if (ALL_NAMESPACES_KEY !== activeNamespace) {
            const oldPath = window.location.pathname;
            const newPath = formatNamespaceRoute(ALL_NAMESPACES_KEY, oldPath, window.location);
            if (newPath !== oldPath) {
              navigate(newPath);
            }
          }
          setLastNamespace(ALL_NAMESPACES_KEY);
        }
        closeOverlay();
        navigate(`/k8s/cluster/${kind.plural}`);
      })
      .catch(() => {
        /* do nothing */
      });
  };

  const onKeyUp = (e) => {
    setConfirmed(e.currentTarget.value === resource.metadata.name);
  };

  return (
    <Modal isOpen onClose={closeOverlay} variant={ModalVariant.small}>
      <ModalHeader
        title={t('Delete {{label}}?', { label: t(kind.labelKey) })}
        titleIconVariant="warning"
      />
      <ModalBody>
        <Content component={ContentVariants.p}>
          <Trans t={t} ns="public">
            This action cannot be undone. It will destroy all pods, services and other objects in
            the namespace{' '}
            <strong className="co-break-word">{{ name: resource.metadata.name }}</strong>.
          </Trans>
        </Content>
        <Content component={ContentVariants.p}>
          <Trans t={t} ns="public">
            Confirm deletion by typing{' '}
            <strong className="co-break-word">{{ name: resource.metadata.name }}</strong> below:
          </Trans>
        </Content>
        <span className="pf-v6-c-form-control">
          <input
            type="text"
            data-test="project-name-input"
            onKeyUp={onKeyUp}
            placeholder={t('Enter name')}
            aria-label={t('Enter the name of the {{label}} to delete', {
              label: t(kind.labelKey),
            })}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        </span>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="danger"
          onClick={onSubmit}
          isLoading={inProgress}
          isDisabled={!confirmed}
          data-test="confirm-action"
        >
          {t('Delete')}
        </Button>
        <Button
          variant="link"
          onClick={closeOverlay}
          data-test="modal-cancel-action"
          data-test-id="modal-cancel-action"
        >
          {t('Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </Modal>
  );
};

export const useDeleteNamespaceModalLauncher = (props: DeleteNamespaceModalProps) => {
  const launcher = useOverlay();
  return useCallback(
    () => launcher<DeleteNamespaceModalProps>(DeleteNamespaceModal, props),
    [launcher, props],
  );
};

type DeleteNamespaceModalProps = {
  resource: K8sResourceKind;
  kind: K8sKind;
} & ModalComponentProps;
