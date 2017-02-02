import React from 'react';

import { k8sKinds, k8sPatch } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent } from '../utils';
import { RadioInput } from './_radio';

class ConfigureOperatorModal extends PromiseComponent {
  constructor(props) {
    super(props);

    const getPath = this.props.path.replace('/', '.').substr(1);
    this.state = Object.assign(this.state, {
      value: _.get(this.props.config, getPath).toString()
    });

    this._change = this._change.bind(this);
    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);
  }

  _change(event) {
    const value = event.target.value;
    this.setState({ value });
  }

  _submit(event) {
    event.preventDefault();

    let value = this.state.value;
    if (this.props.valueType === 'bool') {
      value = value === 'true';
    }

    const patch = [{ op: 'replace', path: this.props.path, value: value }];

    this.handlePromise(
      k8sPatch(k8sKinds.CHANNELOPERATORCONFIG, this.props.config, patch)
    ).then(this.props.close);
  }

  render() {
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>{this.props.title}</ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">{this.props.message}</div>

        {this.props.radios.map((radio) => {
          const checked = radio.value === this.state.value;
          return <RadioInput onChange={this._change} checked={checked} {...radio} />;
        })}
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={this.state.errorMessage}
        inProgress={this.state.inProgress}
        submitText={this.props.buttonText}
        cancel={this._cancel} />
    </form>;
  }
}
ConfigureOperatorModal.propTypes = {
  cancel: React.PropTypes.func.isRequired,
  close: React.PropTypes.func.isRequired,
  config: React.PropTypes.object.isRequired,
  callbacks: React.PropTypes.object.isRequired,
  valueType: React.PropTypes.string
};

export const configureOperatorModal = createModalLauncher(ConfigureOperatorModal);

export const configureOperatorChannelModal = (props) => {
  return configureOperatorModal(_.defaults({}, {
    buttonText: 'Save Channel',
    message: <div>
      <p>Select a channel that provides the correct balance of stability and new features.</p>
      <p>Critical security updates will always be delivered to any vulnerable channels.</p>
    </div>,
    path: '/channel',
    radios: [
      {
        value: 'stable',
        title: <span>Stable <span className="co-no-bold">(recommended)</span></span>,
        desc: 'Ideal for production and fully supported by CoreOS.'
      },
      {
        value: 'beta',
        title: 'Beta',
        desc: 'Test out new features and releases before they are generally available.'
      },
      {
        value: 'alpha',
        title: 'Alpha',
        desc: 'Closely tracks current development work and newer features may be unstable.'
      }
    ],
    title: 'Update Strategy'
  }, props));
};

export const configureOperatorStrategyModal = (props) => {
  return configureOperatorModal(_.defaults({}, {
    buttonText: 'Save Strategy',
    message: <p>Select an update method for the cluster:</p>,
    path: '/automaticUpdate',
    radios: [
      {
        value: 'true',
        title: <span>Automatic <span className="co-no-bold">(recommended)</span></span>,
        desc: 'Stay up to date with the latest version automatically.'
      },
      {
        value: 'false',
        title: 'Admin Approval',
        desc: 'All updates must be approved by an admin. Important security patches may be missed.'
      }
    ],
    title: 'Update Strategy',
    valueType: 'bool'
  }, props));
};
