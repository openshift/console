import * as React from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Alert,
  Tab,
  TabTitleText,
  Tabs,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { CreateProjectModalProps } from '@console/dynamic-plugin-sdk/src';
import { ModalComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/ModalProvider';
import { k8sDeleteResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import {
  SelectorInput,
  resourceObjPath,
  LoadingInline,
  // Dropdown,
} from '@console/internal/components/utils';
import {
  NamespaceModel,
  NetworkPolicyModel,
  UserDefinedNetworkModel,
} from '@console/internal/models';
import { k8sCreate, referenceFor } from '@console/internal/module/k8s';
import './CreateProjectModal.scss';
import DetailsNamespaceTab from './components/DetailsNamespaceTab';
import NetworkTab from './components/NetworkTab';
import { allow, defaultDeny, deny } from './constants';
import useIsUDNInstalled from './useIsUDNInstalled';
import { getUDN } from './utils';

export const CreateNamespaceModal: ModalComponent<CreateProjectModalProps> = ({
  closeModal,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [networkPolicy, setNetworkPolicy] = React.useState(allow);
  const [name, setName] = React.useState('');
  const [labels, setLabels] = React.useState([]);

  const [selectedTab, setSelectedTab] = React.useState(0);
  const [isCreatingUDN, setCreatingUDN] = React.useState(false);
  const [udnName, setUDNName] = React.useState('');
  const [udnSubnet, setUDNSubtnet] = React.useState('');

  const isUDNCrdsInstalled = useIsUDNInstalled();

  const thenPromise = (res) => {
    setInProgress(false);
    setErrorMessage('');
    return res;
  };

  const catchError = (error) => {
    const err = error.message || t('console-shared~An error occurred. Please try again.');
    setInProgress(false);
    setErrorMessage(err);
    return Promise.reject(err);
  };

  const handlePromise = (promise) => {
    setInProgress(true);

    return promise.then(
      (res) => thenPromise(res),
      (error) => catchError(error),
    );
  };

  const createNamespace = () => {
    const namespace = {
      metadata: {
        name,
        labels: { ...SelectorInput.objectify(labels) },
      },
    };
    return k8sCreate(NamespaceModel, namespace);
  };

  const createUDN = (namespaceObj) => {
    const udn = getUDN(udnName, namespaceObj?.metadata?.name, udnSubnet);

    return k8sCreate(UserDefinedNetworkModel, udn).catch((error) => {
      k8sDeleteResource({ model: NamespaceModel, resource: namespaceObj });
      throw Error(error);
    });
  };

  const create = async () => {
    const namespace = await createNamespace();

    if (isCreatingUDN) await createUDN(namespace);

    if (networkPolicy === deny) {
      const policy = Object.assign({}, defaultDeny, {
        metadata: { namespace: name, name: 'default-deny' },
      });
      await k8sCreate(NetworkPolicyModel, policy);
    }
    return namespace;
  };

  const submit = (event) => {
    event.preventDefault();
    handlePromise(create())
      .then((obj) => {
        closeModal();
        if (onSubmit) {
          onSubmit(obj);
        } else {
          navigate(resourceObjPath(obj, referenceFor(obj)));
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(`Failed to create Namespace:`, err);
      });
  };

  return (
    <Modal
      variant={isUDNCrdsInstalled ? ModalVariant.medium : ModalVariant.small}
      title={t('console-shared~Create Namespace')}
      isOpen
      onClose={closeModal}
      actions={[
        <Button
          type="submit"
          variant="primary"
          disabled={inProgress}
          data-test="confirm-action"
          id="confirm-action"
          form="create-namespace-modal-form"
        >
          {t('console-shared~Create')}
        </Button>,
        <Button
          type="button"
          variant="secondary"
          disabled={inProgress}
          onClick={closeModal}
          data-test-id="modal-cancel-action"
        >
          {t('console-shared~Cancel')}
        </Button>,
        ...(inProgress ? [<LoadingInline />] : []),
      ]}
    >
      <form
        onSubmit={submit}
        name="form"
        id="create-namespace-modal-form"
        className="modal-content"
      >
        {isUDNCrdsInstalled ? (
          <div className="create-project-modal__tabs-container">
            <Tabs
              isVertical
              role="region"
              isBox
              className="create-project-modal__tabs"
              activeKey={selectedTab}
              onSelect={(_, newTab) => setSelectedTab(newTab as number)}
            >
              <Tab
                className="create-project-modal__tabs-content"
                eventKey={0}
                title={
                  <TabTitleText aria-label="vertical" role="region">
                    {t('console-shared~Details')}
                  </TabTitleText>
                }
              >
                <DetailsNamespaceTab
                  networkPolicy={networkPolicy}
                  name={name}
                  labels={labels}
                  setNetworkPolicy={setNetworkPolicy}
                  setName={setName}
                  setLabels={setLabels}
                />
              </Tab>
              <Tab
                eventKey={1}
                className="create-project-modal__tabs-content"
                title={<TabTitleText>{t('console-shared~Network')}</TabTitleText>}
              >
                <NetworkTab
                  isCreatingUDN={isCreatingUDN}
                  setCreatingUDN={setCreatingUDN}
                  udnName={udnName}
                  setUDNName={setUDNName}
                  udnSubnet={udnSubnet}
                  setUDNSubtnet={setUDNSubtnet}
                />
              </Tab>
            </Tabs>
          </div>
        ) : (
          <DetailsNamespaceTab
            networkPolicy={networkPolicy}
            name={name}
            labels={labels}
            setNetworkPolicy={setNetworkPolicy}
            setName={setName}
            setLabels={setLabels}
          />
        )}
        {errorMessage && (
          <Alert
            isInline
            className="co-alert co-alert--scrollable"
            variant="danger"
            title={t('console-shared~An error occurred')}
            data-test="alert-error"
          >
            <div className="co-pre-line">{errorMessage}</div>
          </Alert>
        )}
      </form>
    </Modal>
  );
};
