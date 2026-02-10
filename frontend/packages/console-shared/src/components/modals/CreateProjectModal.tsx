import { useState, useCallback } from 'react';
import { Button, Alert, ContentVariants, Content } from '@patternfly/react-core';
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated';
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
      title={t('console-shared~Create Project')}
      isOpen
      onClose={closeModal}
      actions={[
        <Button
          type="submit"
          variant="primary"
          isDisabled={inProgress}
          isLoading={inProgress}
          onClick={submit}
          data-test="confirm-action"
          key="confirm-action"
          id="confirm-action"
        >
          {t('console-shared~Create')}
        </Button>,
        <Button
          type="button"
          variant="link"
          disabled={inProgress}
          onClick={closeModal}
          data-test-id="modal-cancel-action"
          key="cancel-action"
        >
          {t('console-shared~Cancel')}
        </Button>,
      ]}
    >
      <form onSubmit={submit} name="form" className="modal-content">
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
        <div className="form-group">
          <label htmlFor="input-name" className="co-required">
            {t('console-shared~Name')}
          </label>{' '}
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
          <div className="modal-body__field">
            <span className="pf-v6-c-form-control">
              <input
                id="input-name"
                data-test="input-name"
                name="name"
                type="text"
                onChange={(e) => setName(e.target.value)}
                value={name || ''}
                required
              />
            </span>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="input-display-name">{t('console-shared~Display name')}</label>
          <div className="modal-body__field">
            <span className="pf-v6-c-form-control">
              <input
                id="input-display-name"
                name="displayName"
                type="text"
                onChange={(e) => setDisplayName(e.target.value)}
                value={displayName || ''}
              />
            </span>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="input-description">{t('console-shared~Description')}</label>
          <div className="modal-body__field">
            <span className="pf-v6-c-form-control pf-m-resize-vertical">
              <textarea
                id="input-description"
                name="description"
                onChange={(e) => setDescription(e.target.value)}
                value={description || ''}
              />
            </span>
          </div>
        </div>
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
