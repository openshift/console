import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';

import { k8sPatch } from '../../module/k8s';
import { DeploymentModel } from '../../models';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent } from '../utils';
import { RadioInput } from '../radio';

class ConfigureRevisionHistoryLimitModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this.deployment = _.cloneDeep(props.deployment);
    this._onTypeChange = this._onTypeChange.bind(this);
    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);
    this.state = Object.assign(this.state, {
      type: _.isInteger(_.get(this.deployment, 'spec.revisionHistoryLimit')) ? 'custom' : 'unlimited',
    });
  }

  _onTypeChange(event) {
    this.setState({ type: event.target.value });
  }

  _submit(event) {
    event.preventDefault();
    const type = this.state.type;

    const patch = { path: '/spec/revisionHistoryLimit' };
    if (type === 'unlimited') {
      patch.value = null;
      patch.op = 'remove';
    } else if (type === 'custom') {
      patch.value = _.toInteger(event.target.elements['input-max-unavailable'].value);
      patch.op = 'replace';
    }

    this.handlePromise(
      k8sPatch(DeploymentModel, this.deployment, [patch])
    ).then(this.props.close);
  }

  render() {
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Edit Revision History Limit</ModalTitle>
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
                    defaultValue={this.deployment.spec.revisionHistoryLimit}
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
        errorMessage={this.state.errorMessage}
        inProgress={this.state.inProgress}
        submitText="Save Limit"
        cancel={this._cancel} />
    </form>;
  }
}

ConfigureRevisionHistoryLimitModal.propTypes = {
  deployment: PropTypes.object
};

export const configureRevisionHistoryLimitModal = createModalLauncher(ConfigureRevisionHistoryLimitModal);
