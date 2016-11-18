import React from 'react';

import {angulars} from '../react-wrapper';
import {createModalLauncher, ModalTitle, ModalBody, ModalFooter} from '../factory/modal';
import {LoadingInline, PromiseComponent} from '../utils';

class ConfigureYamlFieldModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this.state = {
      resource: this.props.resource,
      resourceLoading: true,
      value: undefined
    };
    this._isMounted = false;
    this._submit = this._submit.bind(this);
    this._cancel = this._cancel.bind(this);
    this._handleChange = this._handleChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      resource: nextProps.resource
    });
  }

  componentDidMount() {
    this._isMounted = true;
    this._loadResource();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  _loadResource() {
    this.setState({ resourceLoading: true });
    angulars.k8s.resource.get(this.props.k8sQuery.kind, this.props.k8sQuery.name, this.props.k8sQuery.namespace)
      .then((resource) => {
        if (!this._isMounted) {
          return;
        }

        let value = _.get(resource, this.props.path);
        if (this.props.k8sQuery.kind === angulars.k8s.kinds.SECRET) {
          value = window.atob(value);
        }

        this.setState({
          resource,
          resourceLoading: false,
          value: value
        });
      }).catch(() => {
        this.setState({ resourceLoading: false });
      });
  }

  _handleChange(event) {
    this.setState({value: event.target.value});
  }

  _cancel() {
    this.props.callbacks.invalidateState(false);
    this.props.cancel();
  }

  _submit(event) {
    event.preventDefault();
    this.props.callbacks.invalidateState(true);

    let value = this.state.value;
    if (this.props.k8sQuery.kind === angulars.k8s.kinds.SECRET) {
      value = window.btoa(value);
    }

    const applyUpdate = () => {
      if (!this.state.resource) {
        const newResource = {
          metadata: {
            name: this.props.k8sQuery.name,
            namespace: this.props.k8sQuery.namespace
          }
        };
        _.set(newResource, this.props.path, value);
        this._setRequestPromise(angulars.k8s.resource.create(this.props.k8sQuery.kind, newResource));
      } else {
        const patchPath = `/${this.props.path.replace('.', '/')}`;
        const patch = [{ op: 'replace', path: patchPath, value: value }];
        this._setRequestPromise(angulars.k8s.resource.patch(this.props.k8sQuery.kind, this.state.resource, patch));
      }
      this.requestPromise.then((result) => {
        this.props.close(result);
      }).catch(() => {
        this.props.callbacks.invalidateState(false);
      });
    };

    if (this.props.callbacks.inputValidator) {
      this._setRequestPromise(this.props.callbacks.inputValidator(value).then(applyUpdate));
    } else {
      applyUpdate();
    }
  }

  render() {
    return <form onSubmit={this._submit} name="form" role="form">
      <ModalTitle>{this.props.modalTitle}</ModalTitle>
      <ModalBody>
        <p>{this.props.modalText}</p>
        { this.state.resourceLoading && <p><LoadingInline></LoadingInline></p> }
        { (this.props.inputType === 'textarea' || this.props.inputType !== 'input') && <textarea value={this.state.value} onChange={this._handleChange} className="form-control" rows="18" disabled={this.state.resourceLoading} /> }
        { this.props.inputType === 'input' && <input value={this.state.value} onChange={this._handleChange} className="form-control" disabled={this.state.resourceLoading} /> }
      </ModalBody>
      <ModalFooter promise={this.requestPromise} errorFormatter="k8sApi">
        <button type="submit" className="btn btn-primary" disabled={this.state.resourceLoading}>Save Setting</button>
        <button type="button" onClick={this._cancel} className="btn btn-link">Cancel</button>
      </ModalFooter>
    </form>;
  }
}
ConfigureYamlFieldModal.propTypes = {
  callbacks: React.PropTypes.object,
  close: React.PropTypes.func,
  inputType: React.PropTypes.string,
  k8sQuery: React.PropTypes.object,
  modalTitle: React.PropTypes.node,
  modalText: React.PropTypes.node,
  path: React.PropTypes.string,
  resource: React.PropTypes.object
};

export const configureYamlFieldModal = createModalLauncher(ConfigureYamlFieldModal);
