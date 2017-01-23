import React from 'react';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent } from '../utils';
import { RadioInput } from './_radio';

class ConfigureRevisionHistoryLimitModal extends PromiseComponent {
  constructor(props) {
    super(props);

    this._onTypeChange = this._onTypeChange.bind(this);
    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);
    this.state = {
      type: _.get(this.props.deployment.spec, 'revisionHistoryLimit') ?
        'custom' : 'unlimited'
    };
  }

  _onTypeChange(event) {
    this.setState({ type: event.target.value });
  }

  _submit(event) {
    event.preventDefault();
    const type = this.state.type;

    if (type === 'unlimited') {
      this.props.deployment.spec.revisionHistoryLimit = null;
    } else if (type === 'custom') {
      this.props.deployment.spec.revisionHistoryLimit = _.toInteger(event.target.elements['input-max-unavailable'].value);
    }
    this.props.close();
  }

  render() {
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Revision History Limit</ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">
          <p>
            History of your configuration changes is kept through a series of ReplicaSets. How many ReplicaSets do you want to retain?
          </p>
        </div>

        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <RadioInput
              onChange={this._onTypeChange}
              value="unlimited"
              checked={this.state.type === 'unlimited'}
              title="Unlimited"
              subTitle="(default)"
              desc="Keep all ReplicaSets in order to facilitate rolling back to previous versions"
              autoFocus={this.state.type === 'unlimited'} />
          </div>

          <div className="col-sm-12">
            <RadioInput
              onChange={this._onTypeChange}
              value="custom"
              checked={this.state.type === 'custom'}
              title="Limit History"
              autoFocus={this.state.type === 'custom'} >
              <div className="co-m-radio-desc">
                <p className="text-muted">
                  Retain recent revisions but garbage-collect older ones automatically
                </p>
                <div className="form-inline">
                  <p className="form-control-static">Keep</p>
                    &nbsp;
                    <input disabled={this.state.type !== 'custom'} size="5"
                    type="number" className="form-control"
                    defaultValue={this.props.deployment.spec.revisionHistoryLimit}
                    id="input-max-unavailable" required />
                    &nbsp;&nbsp;
                  <p className="form-control-static">revisions of this deployment</p>
                </div>
              </div>
            </RadioInput>
          </div>
        </div>

      </ModalBody>
      <ModalSubmitFooter
        errorFormatter="k8sApi"
        submitText="Save Limit"
        cancel={this._cancel} />
    </form>;
  }
}

ConfigureRevisionHistoryLimitModal.propTypes = {
  deployment: React.PropTypes.object
};

export const configureRevisionHistoryLimitModal = createModalLauncher(ConfigureRevisionHistoryLimitModal);
