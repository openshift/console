import * as React from 'react';
import { connect } from 'react-redux';

import { k8sCreate, referenceFor } from '../../module/k8s';
import { NamespaceModel, ProjectRequestModel, NetworkPolicyModel } from '../../models';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { Dropdown, history, PromiseComponent, resourceObjPath, SelectorInput } from '../utils';
import { FLAGS, setFlag } from '../../features';

const allow = 'allow';
const deny = 'deny';

const defaultDeny = {
  'apiVersion': 'networking.k8s.io/v1',
  'kind': 'NetworkPolicy',
  'spec': {
    'podSelector': null,
  },
};

const mapDispatchToProps = dispatch => ({
  setProjectsAvailable: () => setFlag(dispatch, FLAGS.PROJECTS_AVAILABLE, true),
});

const CreateNamespaceModal = connect(null, mapDispatchToProps)(class CreateNamespaceModal extends PromiseComponent {
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
    const {name, labels} = this.state;
    const namespace = {
      metadata: {
        name,
        labels: SelectorInput.objectify(labels),
      },
    };
    return k8sCreate(NamespaceModel, namespace);
  }

  createProject() {
    const {setProjectsAvailable} = this.props;
    const {name, displayName, description} = this.state;
    const project = {
      metadata: {
        name,
      },
      displayName,
      description,
    };
    return k8sCreate(ProjectRequestModel, project).then(obj => {
      // Immediately update the projects available flag to avoid the empty state message from displaying when projects watch is slow.
      setProjectsAvailable();
      return obj;
    });
  }

  _submit(event) {
    event.preventDefault();

    let promise = this.props.createProject ? this.createProject() : this.createNamespace();
    if (this.state.np === deny) {
      promise = promise.then(ns => {
        const policy = Object.assign({}, defaultDeny, {metadata: {namespace: ns.metadata.name, name: 'default-deny'}});
        return k8sCreate(NetworkPolicyModel, policy);
      });
    }

    this.handlePromise(promise).then(obj => {
      this.props.close();
      history.push(resourceObjPath(obj, referenceFor(obj)));
    });
  }

  onLabels(labels) {
    this.setState({labels});
  }

  render() {
    const label = this.props.createProject ? 'Project' : 'Namespace';
    const defaultNetworkPolicies = {
      [allow]: 'No restrictions (default)',
      [deny]: 'Deny all inbound traffic',
    };
    return <form onSubmit={this._submit.bind(this)} name="form" className="co-p-new-user-modal">
      <ModalTitle>Create {label}</ModalTitle>
      <ModalBody>
        <div className="form-group">
          <label htmlFor="input-name" className="control-label">Name</label>
          <div className="modal-body__field">
            <input id="input-name" name="name" type="text" className="form-control" onChange={this.handleChange} value={this.state.name || ''} autoFocus required />
          </div>
        </div>
        {this.props.createProject && <div className="form-group">
          <label htmlFor="input-display-name" className="control-label">Display Name</label>
          <div className="modal-body__field">
            <input id="input-display-name" name="displayName" type="text" className="form-control" onChange={this.handleChange} value={this.state.displayName || ''} />
          </div>
        </div>}
        {this.props.createProject && <div className="form-group">
          <label htmlFor="input-description" className="control-label">Description</label>
          <div className="modal-body__field">
            <textarea id="input-description" name="description" className="form-control" onChange={this.handleChange} value={this.state.description || ''} />
          </div>
        </div>}
        {!this.props.createProject && <div className="form-group">
          <label htmlFor="tags-input" className="control-label">Labels</label>
          <div className="modal-body__field">
            <SelectorInput labelClassName="co-text-namespace" onChange={this.onLabels} tags={[]} />
          </div>
        </div>}
        {!this.props.createProject && <div className="form-group">
          <label htmlFor="network-policy" className="control-label">Default Network Policy</label>
          <div className="modal-body__field ">
            <Dropdown title="No restrictions (default)" items={defaultNetworkPolicies} dropDownClassName="dropdown--full-width" id="dropdown-selectbox" onChange={np => this.setState({np: np})} />
          </div>
        </div>}
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText="Create" cancel={this.props.cancel.bind(this)} />
    </form>;
  }
});

export const createNamespaceModal = createModalLauncher(CreateNamespaceModal);
export const createProjectModal = createModalLauncher(props => <CreateNamespaceModal {...props} createProject={true} />);
