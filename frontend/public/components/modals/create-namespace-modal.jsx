import * as React from 'react';
import { connect } from 'react-redux';
import { Form, FormGroup, TextInput, TextArea, Modal } from '@patternfly/react-core';

import { FLAGS } from '@console/shared';
import { k8sCreate, referenceFor } from '../../module/k8s';
import { NamespaceModel, ProjectRequestModel, NetworkPolicyModel } from '../../models';
import { createPF4ModalLauncher, PF4ModalSubmitFooter } from '../factory/modal';
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
      this.state = {
        np: allow,
        name: '',
        displayName: '',
        description: '',
        isValid: true,
      };
      this.onLabels = this.onLabels.bind(this);
      this.handleNameTextInputChange = this.handleNameTextInputChange.bind(this);
      this.handleDisplayNameTextInputChange = this.handleDisplayNameTextInputChange.bind(this);
      this.handleDescriptionTextInputChange = this.handleDescriptionTextInputChange.bind(this);
    }

    handleNameTextInputChange(name) {
      this.setState({ name });
    }

    handleDisplayNameTextInputChange(displayName) {
      this.setState({ displayName });
    }

    handleDescriptionTextInputChange(description) {
      this.setState({ description });
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
      const { name, isValid } = this.state;
      if (/^$/.test(name)) {
        this.setState({ isValid: false });
        return;
      }
      if (isValid !== true) {
        this.setState({ isValid: true });
      }
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
      this.handlePromise(promise).then((obj) => {
        close();
        if (onSubmit) {
          onSubmit(obj);
        } else {
          history.push(resourceObjPath(obj, referenceFor(obj)));
        }
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
        <Modal
          className="modal-content"
          title={`Create ${label}`}
          isOpen={true}
          onClose={this.props.close.bind(this)}
          isSmall
          footer={
            <PF4ModalSubmitFooter
              errorMessage={this.state.errorMessage}
              inProgress={this.state.inProgress}
              submitText="Create"
              cancel={this.props.cancel.bind(this)}
              submit={this._submit.bind(this)}
              form="create"
            />
          }
        >
          <div className="modal-body">
            <div className="modal-body-content">
              <div className="modal-body-inner-shadow-covers modal-body-inner-shadow-covers-no-padding">
                <Form id="create">
                  <FormGroup
                    label="Name"
                    isRequired
                    fieldId="input-name"
                    helperTextInvalid="Please fill out this field."
                    isValid={this.state.isValid}
                  >
                    <TextInput
                      isRequired
                      type="text"
                      id="input-name"
                      name="name"
                      aria-describedby="input-name"
                      value={this.state.name || ''}
                      onChange={this.handleNameTextInputChange}
                      className="pf-c-form-control"
                    />
                  </FormGroup>
                  {this.props.createProject && (
                    <FormGroup label="Display Name" fieldId="input-display-name">
                      <TextInput
                        type="text"
                        id="input-display-name"
                        name="displayName"
                        value={this.state.displayName || ''}
                        onChange={this.handleDisplayNameTextInputChange}
                      />
                    </FormGroup>
                  )}
                  {this.props.createProject && (
                    <FormGroup label="Description" fieldId="input-description">
                      <TextArea
                        id="input-descripton"
                        name="description"
                        value={this.state.description || ''}
                        onChange={this.handleDescriptionTextInputChange}
                      />
                    </FormGroup>
                  )}
                  {!this.props.createProject && (
                    <FormGroup label="Labels" fieldId="tags-input">
                      <SelectorInput
                        labelClassName="co-text-namespace"
                        onChange={this.onLabels}
                        tags={[]}
                      />
                    </FormGroup>
                  )}
                  {!this.props.createProject && (
                    <FormGroup label="Default Network Policy" fieldId="network-policy">
                      <Dropdown
                        selectedKey={this.state.np}
                        items={defaultNetworkPolicies}
                        dropDownClassName="dropdown--full-width"
                        id="dropdown-selectbox"
                        onChange={(np) => this.setState({ np })}
                      />
                    </FormGroup>
                  )}
                </Form>
              </div>
            </div>
          </div>
        </Modal>
      );
    }
  },
);

export const createNamespaceModal = createPF4ModalLauncher(CreateNamespaceModal);
export const createProjectModal = createPF4ModalLauncher((props) => (
  <CreateNamespaceModal {...props} createProject={true} />
));
