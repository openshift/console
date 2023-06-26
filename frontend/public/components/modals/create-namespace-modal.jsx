import * as React from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Popover, Button } from '@patternfly/react-core';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import {
  documentationURLs,
  ExternalLink,
  getDocumentationURL,
} from '@console/internal/components/utils';

import { FLAGS } from '@console/shared';
import { k8sCreate, referenceFor } from '../../module/k8s';
import { NamespaceModel, ProjectRequestModel, NetworkPolicyModel } from '../../models';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { Dropdown, history, resourceObjPath, SelectorInput } from '../utils';
import { setFlag } from '../../actions/features';

const allow = 'allow';
const deny = 'deny';

const defaultDeny = {
  apiVersion: 'networking.k8s.io/v1',
  kind: 'NetworkPolicy',
  spec: {
    podSelector: null,
  },
};

const mapDispatchToProps = (dispatch) => ({
  hideStartGuide: () => setFlag(dispatch, FLAGS.SHOW_OPENSHIFT_START_GUIDE, false),
});

const CreateNamespaceModalWithTranslation_ = (props) => {
  const { hideStartGuide, close, onSubmit, cancel } = props;

  const [inProgress, setInProgress] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [np, setNp] = React.useState(allow);
  const [name, setName] = React.useState();
  const [labels, setLabels] = React.useState();
  const [displayName, setDisplayName] = React.useState();
  const [description, setDescription] = React.useState();

  const { t } = useTranslation();

  const thenPromise = (res) => {
    setInProgress(false);
    setErrorMessage('');
    return res;
  };

  const catchError = (error) => {
    const err = error.message || t('public~An error occurred. Please try again.');
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
        labels: SelectorInput.objectify(labels),
      },
    };
    return k8sCreate(NamespaceModel, namespace);
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

  const _submit = (event) => {
    event.preventDefault();

    let promise = props.createProject ? createProject() : createNamespace();
    if (np === deny) {
      promise = promise.then((ns) => {
        const policy = Object.assign({}, defaultDeny, {
          metadata: { namespace: ns.metadata.name, name: 'default-deny' },
        });
        // Resolve the promise with the namespace object, not the network policy object, since we want to redirect to the namespace.
        return k8sCreate(NetworkPolicyModel, policy).then(() => ns);
      });
    }

    handlePromise(promise)
      .then((obj) => {
        close();
        if (onSubmit) {
          onSubmit(obj);
        } else {
          history.push(resourceObjPath(obj, referenceFor(obj)));
        }
      })
      .catch((err) => {
        const label = props.createProject ? 'project' : 'namespace';
        // eslint-disable-next-line no-console
        console.error(`Failed to create ${label}:`, err);
      });
  };

  const defaultNetworkPolicies = {
    [allow]: t('public~No restrictions'),
    [deny]: t('public~Deny all inbound traffic'),
  };

  const popoverText = () => {
    const type = props.createProject ? t('public~Project') : t('public~Namespace');
    const nameFormat = t(
      "public~A {{type}} name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character (e.g. 'my-name' or '123-abc').",
      { type },
    );
    const createNamespaceText = t(
      "public~You must create a Namespace to be able to create projects that begin with 'openshift-', 'kubernetes-', or 'kube-'.",
    );
    return (
      <>
        <p>{nameFormat}</p>
        {createProject ? <p>{createNamespaceText}</p> : null}
      </>
    );
  };

  const projectsURL = getDocumentationURL(documentationURLs.workingWithProjects);

  return (
    <form onSubmit={_submit} name="form" className="modal-content">
      <ModalTitle>
        {props.createProject ? t('public~Create Project') : t('public~Create Namespace')}
      </ModalTitle>
      <ModalBody>
        {props.createProject ? (
          <>
            <p>
              {t(
                'public~An OpenShift project is an alternative representation of a Kubernetes namespace.',
              )}
            </p>
            <p>
              <ExternalLink href={projectsURL}>
                {t('public~Learn more about working with projects')}
              </ExternalLink>
            </p>
          </>
        ) : null}

        <div className="form-group">
          <label htmlFor="input-name" className="control-label co-required">
            {t('public~Name')}
          </label>{' '}
          <Popover aria-label={t('public~Naming information')} bodyContent={popoverText}>
            <Button
              className="co-button-help-icon"
              variant="plain"
              aria-label={t('public~View naming information')}
            >
              <OutlinedQuestionCircleIcon />
            </Button>
          </Popover>
          <div className="modal-body__field">
            <input
              id="input-name"
              data-test="input-name"
              name="name"
              type="text"
              className="pf-c-form-control"
              onChange={(e) => setName(e.target.value)}
              value={name || ''}
              autoFocus
              required
            />
          </div>
        </div>
        {props.createProject && (
          <div className="form-group">
            <label htmlFor="input-display-name" className="control-label">
              {t('public~Display name')}
            </label>
            <div className="modal-body__field">
              <input
                id="input-display-name"
                name="displayName"
                type="text"
                className="pf-c-form-control"
                onChange={(e) => setDisplayName(e.target.value)}
                value={displayName || ''}
              />
            </div>
          </div>
        )}
        {props.createProject && (
          <div className="form-group">
            <label htmlFor="input-description" className="control-label">
              {t('public~Description')}
            </label>
            <div className="modal-body__field">
              <textarea
                id="input-description"
                name="description"
                className="pf-c-form-control"
                onChange={(e) => setDescription(e.target.value)}
                value={description || ''}
              />
            </div>
          </div>
        )}
        {!props.createProject && (
          <div className="form-group">
            <label htmlFor="tags-input" className="control-label">
              {t('public~Labels')}
            </label>
            <div className="modal-body__field">
              <SelectorInput
                labelClassName="co-m-namespace"
                onChange={(value) => setLabels(value)}
                tags={[]}
              />
            </div>
          </div>
        )}
        {!props.createProject && (
          <div className="form-group">
            <label htmlFor="network-policy" className="control-label">
              {t('public~Default network policy')}
            </label>
            <div className="modal-body__field ">
              <Dropdown
                selectedKey={np}
                items={defaultNetworkPolicies}
                dropDownClassName="dropdown--full-width"
                id="dropdown-selectbox"
                onChange={(value) => setNp(value)}
              />
            </div>
          </div>
        )}
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('public~Create')}
        cancel={cancel}
      />
    </form>
  );
};

const CreateNamespaceModal = connect(
  null,
  mapDispatchToProps,
)(CreateNamespaceModalWithTranslation_);

export const createNamespaceModal = createModalLauncher(CreateNamespaceModal);
export const createProjectModal = createModalLauncher((props) => (
  <CreateNamespaceModal {...props} createProject={true} />
));
