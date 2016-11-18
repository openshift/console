import React from 'react';

import {angulars} from '../react-wrapper';
import {createModalLauncher, ModalTitle, ModalBody, ModalFooter} from '../factory/modal';
import {PromiseComponent, NumberSpinner} from '../utils';

class ConfigureReplicaCountModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.resource.spec.replicas
    };
    this._change = this._change.bind(this);
    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);
    this._changeValueBy = this._changeValueBy.bind(this);
  }

  _change(event) {
    const value = event.target.value;
    this.setState({value});
  }

  _changeValueBy(operation) {
    this.setState({
      value: _.toInteger(this.state.value) + operation
    });
  }

  _submit(event) {
    event.preventDefault();

    const patch = [{ op: 'replace', path: '/spec/replicas', value: _.toInteger(this.state.value) }];

    this._setRequestPromise(
      angulars.k8s.resource.patch(this.props.resourceKind, this.props.resource, patch)
    ).then(this.props.close);
  }

  render() {
    return <form onSubmit={this._submit} name="form" role="form">
      <ModalTitle>Modify Desired Count</ModalTitle>
      <ModalBody>
        <p>{this.props.resourceKind.labelPlural} maintain the desired number of healthy pods.</p>
        <NumberSpinner className="form-control" value={this.state.value} onChange={this._change} changeValueBy={this._changeValueBy} autoFocus required />
      </ModalBody>
      <ModalFooter promise={this.requestPromise} errorFormatter="k8sApi">
        <button type="submit" className="btn btn-primary">Save Desired Count</button>
        <button type="button" onClick={this._cancel} className="btn btn-link">Cancel</button>
      </ModalFooter>
    </form>;
  }
}
ConfigureReplicaCountModal.propTypes = {
  cancel: React.PropTypes.func.isRequired,
  close: React.PropTypes.func.isRequired,
  resource: React.PropTypes.object.isRequired,
  resourceKind: React.PropTypes.object.isRequired
};

export const configureReplicaCountModal = createModalLauncher(ConfigureReplicaCountModal);
