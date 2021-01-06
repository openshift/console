import * as React from 'react';
import { useTranslation, Trans } from 'react-i18next';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { k8sKill, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import { history } from '@console/internal/components/utils';
import {
  ALL_NAMESPACES_KEY,
  LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
  LAST_NAMESPACE_NAME_USER_SETTINGS_KEY,
  useUserSettingsCompatibility,
  YellowExclamationTriangleIcon,
} from '@console/shared';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { useTranslation, Trans } from 'react-i18next';

export const DeleteNamespaceModal: React.FC<DeleteNamespaceModalProps> = ({
  cancel,
  close,
  kind,
  resource,
}) => {
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
          dispatch(setActiveNamespace(ALL_NAMESPACES_KEY));
          setLastNamespace(ALL_NAMESPACES_KEY);
        }
        close?.();
        history.push(`/k8s/cluster/${kind.plural}`);
      })
      .catch(() => {
        /* do nothing */
      });
  };

  const onKeyUp = (e) => {
    setConfirmed(e.currentTarget.value === resource.metadata.name);
  };
  const { t } = useTranslation();
  const { name } = resource.metadata;

  return (
    <form onSubmit={onSubmit} name="form" className="modal-content ">
      <ModalTitle className="modal-header">
        <YellowExclamationTriangleIcon className="co-icon-space-r" />{' '}
        {t('modal~Delete {{label}}?', kind)}
      </ModalTitle>
      <ModalBody>
        <p>
          <Trans i18nKey="modal~deleteNSWarning">
            This action cannot be undone. It will destroy all pods, services and other objects in
            the namespace <strong className="co-break-word">{{ name }}</strong>.
          </Trans>
        </p>
        <p>
          <Trans i18nKey="modal~deleteNSConfirm">
            Confirm deletion by typing <strong className="co-break-word">{{ name }}</strong> below:
          </Trans>
        </p>
        <input
          type="text"
          data-test="project-name-input"
          className="pf-c-form-control"
          onKeyUp={onKeyUp}
          placeholder={t('modal~Enter name')}
          aria-label={t('modal~Enter the name of the {{label}} to delete', kind)}
          autoFocus={true}
        />
      </ModalBody>
      <ModalSubmitFooter
        submitText={t('modal~Delete')}
        submitDisabled={!confirmed}
        cancel={() => cancel?.()}
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitDanger
      />
    </form>
  );
};

export const deleteNamespaceModal = createModalLauncher(DeleteNamespaceModal);

type DeleteNamespaceModalProps = {
  resource: K8sResourceKind;
  kind: K8sKind;
} & ModalComponentProps;
