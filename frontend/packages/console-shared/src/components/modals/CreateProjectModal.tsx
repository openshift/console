import * as React from 'react';
import {
  Button,
  Modal,
  ModalVariant,
  Alert,
  Tabs,
  Tab,
  TabTitleText,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
  CreateProjectModal as CreateProjectModalExtension,
  CreateProjectModalProps,
  isCreateProjectModal,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk/src';
import { k8sDeleteResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { setFlag } from '@console/internal/actions/features';
import {
  documentationURLs,
  ExternalLink,
  getDocumentationURL,
  isManaged,
  resourceObjPath,
  LoadingInline,
} from '@console/internal/components/utils';
import {
  ProjectModel,
  ProjectRequestModel,
  UserDefinedNetworkModel,
} from '@console/internal/models';
import { k8sCreate, referenceFor } from '@console/internal/module/k8s';
import { FLAGS } from '@console/shared';
import { ModalComponent } from 'packages/console-dynamic-plugin-sdk/src/app/modal-support/ModalProvider';
import './CreateProjectModal.scss';
import DetailsProjectTab from './components/DetailsProjectTab';
import NetworkTab from './components/NetworkTab';
import useIsUDNInstalled from './useIsUDNInstalled';
import { getUDN } from './utils';

const DefaultCreateProjectModal: ModalComponent<CreateProjectModalProps> = ({
  closeModal,
  onSubmit,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [selectedTab, setSelectedTab] = React.useState(0);
  const [name, setName] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const [isCreatingUDN, setCreatingUDN] = React.useState(false);
  const [udnName, setUDNName] = React.useState('');
  const [udnSubnet, setUDNSubtnet] = React.useState('');

  const isUDNCrdsInstalled = useIsUDNInstalled();

  const hideStartGuide = React.useCallback(
    () => dispatch(setFlag(FLAGS.SHOW_OPENSHIFT_START_GUIDE, false)),
    [dispatch],
  );

  const { t } = useTranslation();

  const createProject = () => {
    const project = {
      metadata: {
        name,
      },
      displayName,
      description,
    };

    return k8sCreate(ProjectRequestModel, project);
  };

  const createUDN = (projectObj) => {
    const udn = getUDN(udnName, projectObj?.metadata?.name, udnSubnet);

    return k8sCreate(UserDefinedNetworkModel, udn).catch((error) => {
      k8sDeleteResource({ model: ProjectModel, resource: projectObj });
      throw Error(error);
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setInProgress(true);

    try {
      const projectObj = await createProject();

      if (isCreatingUDN) await createUDN(projectObj);

      hideStartGuide();

      closeModal();
      setErrorMessage('');

      if (onSubmit) {
        onSubmit(projectObj);
      } else {
        navigate(resourceObjPath(projectObj, referenceFor(projectObj)));
      }
    } catch (err) {
      setErrorMessage(err.message || t('console-shared~An error occurred. Please try again.'));
      // eslint-disable-next-line no-console
      console.error(`Failed to create Project:`, err);
    }

    setInProgress(false);
  };

  const projectsURL = getDocumentationURL(documentationURLs.workingWithProjects);

  return (
    <Modal
      variant={isUDNCrdsInstalled ? ModalVariant.medium : ModalVariant.small}
      title={t('console-shared~Create Project')}
      isOpen
      onClose={closeModal}
      actions={[
        <Button
          type="submit"
          variant="primary"
          disabled={inProgress}
          data-test="confirm-action"
          form="create-project-modal-form"
          id="confirm-action"
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
      <form onSubmit={submit} name="form" id="create-project-modal-form" className="modal-content">
        <p>
          {t(
            'console-shared~An OpenShift project is an alternative representation of a Kubernetes namespace.',
          )}
        </p>
        {!isManaged() && (
          <p>
            <ExternalLink href={projectsURL}>
              {t('console-shared~Learn more about working with projects')}
            </ExternalLink>
          </p>
        )}
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
                <DetailsProjectTab
                  name={name}
                  displayName={displayName}
                  description={description}
                  setName={setName}
                  setDisplayName={setDisplayName}
                  setDescription={setDescription}
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
          <DetailsProjectTab
            name={name}
            displayName={displayName}
            description={description}
            setName={setName}
            setDisplayName={setDisplayName}
            setDescription={setDescription}
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

export const CreateProjectModal: ModalComponent<CreateProjectModalProps> = (props) => {
  // Get create project modal extensions
  const [createProjectModalExtensions, resolved] = useResolvedExtensions<
    CreateProjectModalExtension
  >(isCreateProjectModal);

  // resolve the modal component from the extensions, if at least one exists
  const Component = createProjectModalExtensions?.[0]?.properties?.component;

  // If extensions are not resolved yet, return null
  if (!resolved) {
    return null;
  }

  // If extension modal component exists, render it, else render default
  return Component ? <Component {...props} /> : <DefaultCreateProjectModal {...props} />;
};
