import * as React from 'react';
import { connect } from 'react-redux';

import { FLAGS } from '@console/shared';
import { k8sCreate, referenceFor } from '../../module/k8s';
import { NamespaceModel, ProjectRequestModel, NetworkPolicyModel } from '../../models';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { Dropdown, history, PromiseComponent, resourceObjPath, SelectorInput } from '../utils';
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

const CreateNamespaceModal = connect(
  null,
  mapDispatchToProps,
)(
  class CreateNamespaceModal extends PromiseComponent {
    constructor(props) {
      super(props);
      this.state.np = allow;
      this.handleChange = this.handleChange.bind(this);
      this.onLabels = this.onLabels.bind(this);
    }

    handleChange(e) {
      const name = e.target.name;
      const value = e.target.value;
      this.setState({
        [name]: value,
      });
    }

    createNamespace() {
      const { name, labels } = this.state;
      const namespace = {
        metadata: {
          name,
          labels: SelectorInput.objectify(labels),
        },
      };
      return k8sCreate(NamespaceModel, namespace);
    }

    createProject() {
      const { hideStartGuide } = this.props;
      const { name, displayName, description } = this.state;
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
    }

    _submit(event) {
      event.preventDefault();
      const { createProject, close, onSubmit } = this.props;

      let promise = createProject ? this.createProject() : this.createNamespace();
      if (this.state.np === deny) {
        promise = promise.then((ns) => {
          const policy = Object.assign({}, defaultDeny, {
            metadata: { namespace: ns.metadata.name, name: 'default-deny' },
          });
          // Resolve the promise with the namespace object, not the network policy object, since we want to redirect to the namespace.
          return k8sCreate(NetworkPolicyModel, policy).then(() => ns);
        });
      }

      this.handlePromise(promise)
        .then((obj) => {
          close();
          if (onSubmit) {
            onSubmit(obj);
          } else {
            history.push(resourceObjPath(obj, referenceFor(obj)));
          }
        })
        .catch((err) => {
          const label = createProject ? 'project' : 'namespace';
          // eslint-disable-next-line no-console
          console.error(`Failed to create ${label}:`, err);
        });
    }

    onLabels(labels) {
      this.setState({ labels });
    }

    render() {
      const label = this.props.createProject ? 'Project' : 'Namespace';
      const defaultNetworkPolicies = {
        [allow]: 'No restrictions',
        [deny]: 'Deny all inbound traffic',
      };
      return (
        <form
          onSubmit={this._submit.bind(this)}
          name="form"
          className="modal-content modal-content--no-inner-scroll"
        >
          <ModalTitle>Create {label}</ModalTitle>
          <ModalBody>
            <div className="form-group">
              <label htmlFor="input-name" className="control-label co-required">
                Name
              </label>
              <div className="modal-body__field">
                <input
                  id="input-name"
                  data-test="input-name"
                  name="name"
                  type="text"
                  className="pf-c-form-control"
                  onChange={this.handleChange}
                  value={this.state.name || ''}
                  autoFocus
                  required
                />
              </div>
            </div>
            {this.props.createProject && (
              <div className="form-group">
                <label htmlFor="input-display-name" className="control-label">
                  Display Name
                </label>
                <div className="modal-body__field">
                  <input
                    id="input-display-name"
                    name="displayName"
                    type="text"
                    className="pf-c-form-control"
                    onChange={this.handleChange}
                    value={this.state.displayName || ''}
                  />
                </div>
              </div>
            )}
            {this.props.createProject && (
              <div className="form-group">
                <label htmlFor="input-description" className="control-label">
                  Description
                </label>
                <div className="modal-body__field">
                  <textarea
                    id="input-description"
                    name="description"
                    className="pf-c-form-control"
                    onChange={this.handleChange}
                    value={this.state.description || ''}
                  />
                </div>
              </div>
            )}
            {!this.props.createProject && (
              <div className="form-group">
                <label htmlFor="tags-input" className="control-label">
                  Labels
                </label>
                <div className="modal-body__field">
                  <SelectorInput
                    labelClassName="co-text-namespace"
                    onChange={this.onLabels}
                    tags={[]}
                  />
                </div>
              </div>
            )}
            {!this.props.createProject && (
              <div className="form-group">
                <label htmlFor="network-policy" className="control-label">
                  Default Network Policy
                </label>
                <div className="modal-body__field ">
                  <Dropdown
                    selectedKey={this.state.np}
                    items={defaultNetworkPolicies}
                    dropDownClassName="dropdown--full-width"
                    id="dropdown-selectbox"
                    onChange={(np) => this.setState({ np })}
                  />
                </div>
              </div>
            )}
          </ModalBody>
          <ModalSubmitFooter
            errorMessage={this.state.errorMessage}
            inProgress={this.state.inProgress}
            submitText="Create"
            cancel={this.props.cancel.bind(this)}
          />
        </form>
      );
    }
  },
);

export const createNamespaceModal = createModalLauncher(CreateNamespaceModal);
export const createProjectModal = createModalLauncher((props) => (
  <CreateNamespaceModal {...props} createProject={true} />
));
