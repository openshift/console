import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';

import {k8sCreate, k8sGet, k8sPatch} from '../../module/k8s';
import {createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter} from '../factory/modal';
import {LoadingInline, PromiseComponent, kindObj, LoadError} from '../utils';

class ConfigureYamlFieldModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this.state = Object.assign(this.state, {
      resource: this.props.resource,
      resourceLoading: true,
      value: null,
      loadError: false
    });
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
    super.componentDidMount();
    this._loadResource();
  }

  _kindObj() {
    return kindObj(this.props.k8sQuery.kind);
  }

  _loadResource() {
    this.setState({ resourceLoading: true });
    k8sGet(this._kindObj(), this.props.k8sQuery.name, this.props.k8sQuery.namespace)
      .then((resource) => {

        let value = _.get(resource, this.props.path);
        if (this.props.k8sQuery.kind === 'Secret') {
          value = window.atob(value);
        }
        this.setState({
          resource,
          resourceLoading: false,
          value
        });
      }).catch(() => {
        this.setState({ resourceLoading: false, loadError: true, value: null });
      });
  }

  _handleChange(event) {
    this.setState({value: event.target.value});
  }

  _cancel() {
    if (this.props.callbacks.invalidateState) {
      this.props.callbacks.invalidateState(false);
    }
    this.props.cancel();
  }

  _submit(event) {
    event.preventDefault();
    if (this.props.callbacks.invalidateState) {
      this.props.callbacks.invalidateState(true);
    }

    let value = this.state.value;
    if (this.props.k8sQuery.kind === 'Secret') {
      value = window.btoa(value);
    }

    const applyUpdate = () => {
      let promise;
      if (!this.state.resource) {
        const newResource = {
          metadata: {
            name: this.props.k8sQuery.name,
            namespace: this.props.k8sQuery.namespace
          }
        };
        _.set(newResource, this.props.path, value);
        promise = k8sCreate(this._kindObj(), newResource);
      } else {
        const patchPath = `/${this.props.path.replace('.', '/')}`;
        const patch = [{ op: 'replace', path: patchPath, value: value }];
        promise = k8sPatch(this._kindObj(), this.state.resource, patch);
      }
      this.handlePromise(promise)
        .then(result => this.props.close(result))
        .catch(() => {
          if (this.props.callbacks.invalidateState) {
            this.props.callbacks.invalidateState(false);
          }
        });
    };

    if (this.props.callbacks.inputValidator) {
      this.handlePromise(this.props.callbacks.inputValidator(value).then(applyUpdate));
    } else {
      applyUpdate();
    }
  }

  render() {
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>{this.props.modalTitle}</ModalTitle>
      <ModalBody>
        <p>{this.props.modalText}</p>
        { this.state.resourceLoading && <LoadingInline /> }
        { (this.props.inputType === 'textarea' || this.props.inputType !== 'input') && this.state.value !== null && <textarea value={this.state.value} onChange={this._handleChange} className="form-control" rows="18" disabled={this.state.resourceLoading} /> }
        { this.props.inputType === 'input' && <input value={this.state.value} onChange={this._handleChange} className="form-control" disabled={this.state.resourceLoading} /> }
        {this.state.loadError && <LoadError label="Tectonic License" />}
      </ModalBody>
      <ModalSubmitFooter submitText="Save Setting" submitDisabled={this.state.resourceLoading || this.state.loadError} cancel={this._cancel} errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} />
    </form>;
  }
}
ConfigureYamlFieldModal.propTypes = {
  callbacks: PropTypes.object,
  close: PropTypes.func,
  inputType: PropTypes.string,
  k8sQuery: PropTypes.object,
  modalTitle: PropTypes.node,
  modalText: PropTypes.node,
  path: PropTypes.string,
  resource: PropTypes.object
};

export const configureYamlFieldModal = createModalLauncher(ConfigureYamlFieldModal);
