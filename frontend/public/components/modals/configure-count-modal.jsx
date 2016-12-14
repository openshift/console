import React from 'react';

import {angulars} from '../react-wrapper';
import {createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter} from '../factory/modal';
import {PromiseComponent, NumberSpinner} from '../utils';

class ConfigureCountModal extends PromiseComponent {
  constructor(props) {
    super(props);

    const getPath = this.props.path.substring(1).replace('/', '.');
    this.state = {
      value: _.get(this.props.resource, getPath)
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

    const patch = [{ op: 'replace', path: this.props.path, value: _.toInteger(this.state.value) }];

    this._setRequestPromise(
      angulars.k8s.resource.patch(this.props.resourceKind, this.props.resource, patch)
    ).then(this.props.close);
  }

  render() {
    return <form onSubmit={this._submit} name="form" role="form">
      <ModalTitle>{this.props.title}</ModalTitle>
      <ModalBody>
        <p>{this.props.message}</p>
        <NumberSpinner className="form-control" value={this.state.value} onChange={this._change} changeValueBy={this._changeValueBy} autoFocus required />
      </ModalBody>
      <ModalSubmitFooter promise={this.requestPromise} errorFormatter="k8sApi" submitText={this.props.buttonText} cancel={this._cancel} />
    </form>;
  }
}
ConfigureCountModal.propTypes = {
  buttonText: React.PropTypes.node.isRequired,
  cancel: React.PropTypes.func.isRequired,
  close: React.PropTypes.func.isRequired,
  path: React.PropTypes.string.isRequired,
  resource: React.PropTypes.object.isRequired,
  resourceKind: React.PropTypes.object.isRequired,
  title: React.PropTypes.node.isRequired
};

export const configureCountModal = createModalLauncher(ConfigureCountModal);

export const configureReplicaCountModal = (props) => {
  return configureCountModal(_.defaults({}, {
    title: 'Modify Desired Count',
    message: `${props.resourceKind.labelPlural} maintain the desired number of healthy pods.`,
    path: '/spec/replicas',
    buttonText: 'Save Desired Count'
  }, props));
};
