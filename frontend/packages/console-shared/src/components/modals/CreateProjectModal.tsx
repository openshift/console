import { useState, useCallback } from 'react';
import {
  Button,
  ContentVariants,
  Content,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  TextArea,
  TextInput,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import type {
  CreateProjectModal as CreateProjectModalExtension,
  CreateProjectModalProps,
} from '@console/dynamic-plugin-sdk/src';
import { isCreateProjectModal, useResolvedExtensions } from '@console/dynamic-plugin-sdk/src';
import { setFlag } from '@console/internal/actions/flags';
import {
  documentationURLs,
  getDocumentationURL,
  isManaged,
} from '@console/internal/components/utils/documentation';
import { FieldLevelHelp } from '@console/internal/components/utils/field-level-help';
import { resourceObjPath } from '@console/internal/components/utils/resource-link';
import { ProjectRequestModel } from '@console/internal/models';
import { k8sCreate, referenceFor } from '@console/internal/module/k8s';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { FLAGS } from '@console/shared/src/constants/common';
import type { ModalComponent } from 'packages/console-dynamic-plugin-sdk/src/app/modal-support/ModalProvider';

const DefaultCreateProjectModal: ModalComponent<CreateProjectModalProps> = ({
  closeModal,
  onSubmit,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [inProgress, setInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const hideStartGuide = useCallback(
    () => dispatch(setFlag(FLAGS.SHOW_OPENSHIFT_START_GUIDE, false)),
    [dispatch],
  );

  const { t } = useTranslation();

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

  const createProject = () => {
    const project = {
      metadata: {
        name,
      },
      displayName,
      description,
    };
    return k8sCreate(ProjectRequestModel, project).then((obj) => {
      // Immediately update the start guide flag to avoid the empty state
      // message from displaying when projects watch is slow.
      hideStartGuide();
      return obj;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    handlePromise(createProject())
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
        console.error(`Failed to create Project:`, err);
      });
  };

  const projectsURL = getDocumentationURL(documentationURLs.workingWithProjects);

  return (
    <Modal
      variant={ModalVariant.small}
      isOpen
      onClose={closeModal}
      aria-labelledby="create-project-modal-title"
    >
      <ModalHeader
        title={t('console-shared~Create Project')}
        labelId="create-project-modal-title"
      />
      <ModalBody>
        <Content component={ContentVariants.p}>
          {t(
            'console-shared~An OpenShift project is an alternative representation of a Kubernetes namespace.',
          )}
        </Content>
        {!isManaged() && (
          <Content component={ContentVariants.p}>
            <ExternalLink href={projectsURL}>
              {t('console-shared~Learn more about working with projects')}
            </ExternalLink>
          </Content>
        )}
        <Form onSubmit={submit} id="create-project-form">
          <FormGroup
            label={t('console-shared~Name')}
            isRequired
            fieldId="input-name"
            labelHelp={
              <FieldLevelHelp>
                <Content component={ContentVariants.p}>
                  {t(
                    "console-shared~A Project name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character (e.g. 'my-name' or '123-abc').",
                  )}
                </Content>
                <Content component={ContentVariants.p}>
                  {t(
                    "console-shared~You must create a Namespace to be able to create projects that begin with 'openshift-', 'kubernetes-', or 'kube-'.",
                  )}
                </Content>
              </FieldLevelHelp>
            }
          >
            <TextInput
              id="input-name"
              data-test="input-name"
              name="name"
              type="text"
              onChange={(_event, value) => setName(value)}
              value={name}
              isRequired
            />
          </FormGroup>
          <FormGroup label={t('console-shared~Display name')} fieldId="input-display-name">
            <TextInput
              id="input-display-name"
              name="displayName"
              type="text"
              onChange={(_event, value) => setDisplayName(value)}
              value={displayName}
            />
          </FormGroup>
          <FormGroup label={t('console-shared~Description')} fieldId="input-description">
            <TextArea
              id="input-description"
              name="description"
              onChange={(_event, value) => setDescription(value)}
              value={description}
              resizeOrientation="vertical"
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          isDisabled={inProgress}
          isLoading={inProgress}
          form="create-project-form"
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('console-shared~Create')}
        </Button>
        <Button
          type="button"
          variant="link"
          isDisabled={inProgress}
          onClick={closeModal}
          data-test-id="modal-cancel-action"
        >
          {t('console-shared~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
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
