import * as React from 'react';
import { Popover, Button, Alert } from '@patternfly/react-core';
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME out-of-sync @types/react-redux version as new types cause many build errors
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
  CreateProjectModal as CreateProjectModalExtension,
  CreateProjectModalProps,
  isCreateProjectModal,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk/src';
import { setFlag } from '@console/internal/actions/flags';
import {
  documentationURLs,
  getDocumentationURL,
  isManaged,
} from '@console/internal/components/utils/documentation';
import { ExternalLink } from '@console/internal/components/utils/link';
import { resourceObjPath } from '@console/internal/components/utils/resource-link';
import { ProjectRequestModel } from '@console/internal/models';
import { k8sCreate, referenceFor } from '@console/internal/module/k8s';
import { FLAGS } from '@console/shared';
import { LoadingInline } from '@console/shared/src/components/loading/LoadingInline';
import { ModalComponent } from 'packages/console-dynamic-plugin-sdk/src/app/modal-support/ModalProvider';

const DefaultCreateProjectModal: ModalComponent<CreateProjectModalProps> = ({
  closeModal,
  onSubmit,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [name, setName] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const hideStartGuide = React.useCallback(
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

  const popoverText = () => {
    const nameFormat = t(
      "console-shared~A Project name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character (e.g. 'my-name' or '123-abc').",
    );
    const createNamespaceText = t(
      "console-shared~You must create a Namespace to be able to create projects that begin with 'openshift-', 'kubernetes-', or 'kube-'.",
    );
    return (
      <>
        <p>{nameFormat}</p>
        <p>{createNamespaceText}</p>
      </>
    );
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
          disabled={inProgress}
          onClick={submit}
          data-test="confirm-action"
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
      <form onSubmit={submit} name="form" className="modal-content">
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
        <div className="form-group">
          <label htmlFor="input-name" className="control-label co-required">
            {t('console-shared~Name')}
          </label>{' '}
          <Popover aria-label={t('console-shared~Naming information')} bodyContent={popoverText}>
            <Button
              icon={<OutlinedQuestionCircleIcon />}
              className="co-button-help-icon"
              variant="plain"
              aria-label={t('console-shared~View naming information')}
            />
          </Popover>
          <div className="modal-body__field">
            <input
              id="input-name"
              data-test="input-name"
              name="name"
              type="text"
              className="pf-v5-c-form-control"
              onChange={(e) => setName(e.target.value)}
              value={name || ''}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="input-display-name" className="control-label">
            {t('console-shared~Display name')}
          </label>
          <div className="modal-body__field">
            <input
              id="input-display-name"
              name="displayName"
              type="text"
              className="pf-v5-c-form-control"
              onChange={(e) => setDisplayName(e.target.value)}
              value={displayName || ''}
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="input-description" className="control-label">
            {t('console-shared~Description')}
          </label>
          <div className="modal-body__field">
            <textarea
              id="input-description"
              name="description"
              className="pf-v5-c-form-control pf-m-resize-both"
              onChange={(e) => setDescription(e.target.value)}
              value={description || ''}
            />
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
