import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';

import { k8sPatch } from '../../module/k8s';
import { ChannelOperatorConfigModel } from '../../models';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent } from '../utils';
import { RadioInput } from '../radio';

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
      k8sPatch(ChannelOperatorConfigModel, this.props.config, patch)
    ).then(this.props.close);
  }

  render() {
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>{this.props.title}</ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">{this.props.message}</div>

        {this.props.radios.map((radio) => {
          const checked = radio.value === this.state.value;
          return <RadioInput key={radio.value} onChange={this._change} checked={checked} {...radio} />;
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
  cancel: PropTypes.func.isRequired,
  close: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  callbacks: PropTypes.object.isRequired,
  valueType: PropTypes.string
};

const configureOperatorModal = createModalLauncher(ConfigureOperatorModal);

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
