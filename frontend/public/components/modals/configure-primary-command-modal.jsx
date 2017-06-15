import React from 'react';

import { fromArgs, toArgs } from '../../module/k8s/command';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { RadioInput } from '../radio';

class ConfigurePrimaryCommandModal extends React.Component {
  constructor(props) {
    super(props);

    this._cancel = this.props.cancel.bind(this);
    this._submit = this._submit.bind(this);
    this._changeType = this._changeType.bind(this);
    this._changeCommand = this._changeCommand.bind(this);

    let type = 'default';
    let command = '';
    if (!_.isEmpty(this.props.container.command)) {
      type = 'custom';
      command = fromArgs(this.props.container.command);
    }

    this.state = {
      type,
      command
    };
  }

  _changeType(event) {
    this.setState({
      type: event.target.value
    });
  }

  _changeCommand(event) {
    this.setState({
      command: event.target.value
    });
  }

  _submit(event) {
    event.preventDefault();

    let command;
    if (this.state.type === 'default') {
      command = null;
    } else {
      command = toArgs(this.state.command);
    }

    this.props.close(command);
  }

  render() {
    const defaultTitle = <span>Use default command of the container <span className="co-no-bold">(default)</span></span>;

    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Configure Primary Command</ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">
          <p>Select the primary command to run within this container.</p>
        </div>

        <div className="co-m-form-row">
          <RadioInput onChange={this._changeType} value="default" checked={this.state.type === 'default'} title={defaultTitle} desc="If a command hasn't been specified in the container image, the pod will fail when created." autoFocus={this.state.type === 'default'} />
        </div>

        <div className="co-m-form-row">
          <RadioInput onChange={this._changeType} value="custom" checked={this.state.type === 'custom'} title="Provide a command" autoFocus={this.state.type === 'custom'}>
            <div className="co-m-radio-desc">
              <textarea value={this.state.command} onChange={this._changeCommand} required={this.state.type === 'custom'} disabled={this.state.type !== 'custom'} className="form-control" id="command-custom-input" />
            </div>
          </RadioInput>
        </div>
      </ModalBody>
      <ModalSubmitFooter submitText="Save Primary Command" cancel={this._cancel} />
    </form>;
  }
}
ConfigurePrimaryCommandModal.propTypes = {
  container: React.PropTypes.object
};

export const configurePrimaryCommandModal = createModalLauncher(ConfigurePrimaryCommandModal);
