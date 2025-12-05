import * as React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { RootState } from '@console/internal/redux';
import { k8sKill, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { ModalComponentProps } from '@console/internal/components/factory/modal';
import {
  ALL_NAMESPACES_KEY,
  LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
  LAST_NAMESPACE_NAME_USER_SETTINGS_KEY,
} from '@console/shared/src/constants/common';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { getActiveNamespace } from '../../reducers/ui';
import { setActiveNamespace, formatNamespaceRoute } from '../../actions/ui';
import {
  Button,
  Modal,
  ModalHeader,
  ModalVariant,
  ModalBody,
  ModalFooter,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import { OverlayComponent, useOverlay } from '@console/dynamic-plugin-sdk/src/lib-core';
import { ErrorMessage } from '../utils/button-bar';

export const DeleteNamespaceModal: OverlayComponent<DeleteNamespaceModalProps> = ({
  kind,
  resource,
  closeOverlay,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const [confirmed, setConfirmed] = React.useState(false);

  /**
   * This is a workaround because modal launcher renders all modals outside of main app context.
   * This leads to namespace context not being available in modal so we access the redux store and use settings directly as a workaround.
   *  */
  const dispatch = useDispatch();
  const activeNamespace = useSelector((state: RootState) => getActiveNamespace(state));
  const [, setLastNamespace] = useUserSettingsCompatibility<string>(
    LAST_NAMESPACE_NAME_USER_SETTINGS_KEY,
    LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
  );

  const onSubmit = (event) => {
    event.preventDefault();
    handlePromise(k8sKill(kind, resource))
      .then(() => {
        if (resource.metadata.name === activeNamespace) {
          if (ALL_NAMESPACES_KEY !== activeNamespace) {
            const oldPath = window.location.pathname;
            const newPath = formatNamespaceRoute(ALL_NAMESPACES_KEY, oldPath, window.location);
            if (newPath !== oldPath) {
              navigate(newPath);
            }
          }
          dispatch(setActiveNamespace(ALL_NAMESPACES_KEY));
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
        title={t('public~Delete {{label}}?', { label: t(kind.labelKey) })}
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
            placeholder={t('public~Enter name')}
            aria-label={t('public~Enter the name of the {{label}} to delete', {
              label: t(kind.labelKey),
            })}
            autoFocus={true}
          />
        </span>
      </ModalBody>
      <ModalFooter>
        {errorMessage && <ErrorMessage message={errorMessage} />}
        <Button
          type="submit"
          variant="danger"
          onClick={onSubmit}
          isLoading={inProgress}
          isDisabled={!confirmed}
          data-test="confirm-action"
        >
          {t('public~Delete')}
        </Button>
        <Button variant="secondary" onClick={closeOverlay} data-test-id="modal-cancel-action">
          {t('public~Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const useDeleteNamespaceModalLauncher = (props: DeleteNamespaceModalProps) => {
  const launcher = useOverlay();
  return React.useCallback(() => launcher<DeleteNamespaceModalProps>(DeleteNamespaceModal, props), [
    launcher,
    props,
  ]);
};

type DeleteNamespaceModalProps = {
  resource: K8sResourceKind;
  kind: K8sKind;
} & ModalComponentProps;
