import React from 'react';

import { k8sKinds, k8sPatch } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent, Dropdown } from '../utils';

class ConfigureOperatorChannel extends PromiseComponent {
  constructor(props) {
    super(props);

    this.state = Object.assign(this.state, {
      value: _.get(this.props.config, 'channel').toString()
    });

    this._change = this._change.bind(this);
    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);
  }

  _change(value) {
    this.setState({ value });
  }

  _submit(event) {
    event.preventDefault();
    const patch = [{ op: 'replace', path: '/channel', value: this.state.value }];

    this.handlePromise(
      k8sPatch(k8sKinds.ChannelOperatorConfig, this.props.config, patch)
    ).then(this.props.close);
  }

  render() {
    const items = {
      'tectonic-1.6': 'Tectonic-1.6',
      'tectonic-1.7-preproduction': 'Tectonic-1.7-preproduction',
      'tectonic-1.7-production': 'Tectonic-1.7-production',
    };
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Update Channel</ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">
          <div>
            <p>Select a channel that reflects your desired Tectonic Version. <a href="https://coreos.com/tectonic/releases/" target="_blank">Read the release notes</a> for more information.</p>
            <p>Critical security updates will always be delivered to any vulnerable channels.</p>
          </div>
        </div>
        <div className="row co-m-form-row">
          <div className="col-xs-5">
            <Dropdown className="co-cluster-channel-dropdown" title={_.capitalize(this.state.value)} items={items} onChange={this._change} />
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={this.state.errorMessage}
        inProgress={this.state.inProgress}
        submitText="Save Channel"
        cancel={this._cancel} />
    </form>;
  }
}
ConfigureOperatorChannel.propTypes = {
  cancel: React.PropTypes.func.isRequired,
  close: React.PropTypes.func.isRequired,
  config: React.PropTypes.object.isRequired,
  callbacks: React.PropTypes.object.isRequired,
  valueType: React.PropTypes.string
};

export const configureOperatorChannelModal = createModalLauncher(ConfigureOperatorChannel);
