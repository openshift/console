import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Tooltip } from '../utils/tooltip';

import { k8sPatch } from '../../module/k8s';
import { DeploymentModel } from '../../models';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent, pluralize } from '../utils';
import { RadioInput } from '../radio';

const getNumberOrPercent = (value) => {
  if (typeof value === 'undefined') {
    return null;
  }
  if (typeof value === 'string' && value.indexOf('%') > -1) {
    return value;
  }

  return _.toInteger(value);
};

class ConfigureUpdateStrategyModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this.deployment = _.cloneDeep(props.deployment);
    this._onTypeChange = this._onTypeChange.bind(this);
    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);

    this.state = Object.assign({
      strategyType: _.get(this.deployment.spec, 'strategy.type')
    }, this.state);
  }

  _onTypeChange(event) {
    this.setState({ strategyType: event.target.value });
  }

  _submit(event) {
    event.preventDefault();
    const type = this.state.strategyType;

    const patch = { path: '/spec/strategy/rollingUpdate' };
    if (type === 'RollingUpdate') {
      patch.value = {
        maxUnavailable: getNumberOrPercent(event.target.elements['input-max-unavailable'].value || '25%'),
        maxSurge: getNumberOrPercent(event.target.elements['input-max-surge'].value || '25%')
      };
      patch.op = 'add';
    } else {
      patch.op = 'remove';
    }

    this.handlePromise(
      k8sPatch(DeploymentModel, this.deployment, [patch, {path: '/spec/strategy/type', value: type, op: 'replace'}])
    ).then(this.props.close, () => {});
  }

  render() {
    const maxUnavailable = _.get(this.deployment.spec, 'strategy.rollingUpdate.maxUnavailable', '');
    const maxSurge = _.get(this.deployment.spec, 'strategy.rollingUpdate.maxSurge', '');

    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Edit Update Strategy</ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">
          <p>
            How should the pods be replaced when a new revision is created?
          </p>
        </div>

        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <RadioInput
              onChange={this._onTypeChange}
              value="RollingUpdate"
              checked={this.state.strategyType === 'RollingUpdate'}
              title="RollingUpdate"
              subTitle="(default)"
              autoFocus={this.state.strategyType === 'RollingUpdate'}>
              <div className="co-m-radio-desc">
                <p className="text-muted">
                  Execute a smooth roll out of the new revision, based on the settings below
                </p>

                <div className="row co-m-form-row">
                  <div className="col-sm-3">
                    <label htmlFor="input-max-unavailable" className="control-label">
                      Max Unavailable
                    </label>
                  </div>
                  <div className="co-m-form-col col-sm-9">
                    <div className="form-inline">
                      <div className="input-group">
                        <input disabled={this.state.strategyType !== 'RollingUpdate'}
                          placeholder="25%" size="5" type="text" className="form-control"
                          id="input-max-unavailable"
                          defaultValue={maxUnavailable} />
                        <span className="input-group-addon">
                          <Tooltip content="Current desired pod count">of { pluralize(this.deployment.spec.replicas, 'pod')}</Tooltip>
                        </span>
                      </div>
                    </div>
                    <p className="help-block text-muted">Number or percentage of total pods at the start of the update (optional)</p>
                  </div>
                </div>

                <div className="row co-m-form-row">
                  <div className="col-sm-3">
                    <label htmlFor="input-max-surge" className="control-label">Max Surge</label>
                  </div>
                  <div className="co-m-form-col col-sm-9">
                    <div className="form-inline">
                      <div className="input-group">
                        <input disabled={this.state.strategyType !== 'RollingUpdate'} placeholder="25%" size="5" type="text" className="form-control"
                          id="input-max-surge"
                          defaultValue={maxSurge} />
                        <span className="input-group-addon">
                          <Tooltip content="Current desired pod count">greater than { pluralize(this.deployment.spec.replicas, 'pod')}</Tooltip>
                        </span>
                      </div>
                    </div>
                    <p className="help-block text-muted">Number or percentage of total pods at the start of the update (optional)</p>
                  </div>
                </div>
              </div>
            </RadioInput>
          </div>

          <div className="col-sm-12">
            <RadioInput
              onChange={this._onTypeChange}
              value="Recreate"
              checked={this.state.strategyType === 'Recreate'}
              title="Recreate"
              desc="Shut down all existing pods before creating new ones"
              autoFocus={this.state.strategyType === 'Recreate'} />
          </div>

        </div>

      </ModalBody>
      <ModalSubmitFooter
        errorMessage={this.state.errorMessage}
        inProgress={this.state.inProgress}
        submitText="Save Strategy"
        cancel={this._cancel} />
    </form>;
  }
}

ConfigureUpdateStrategyModal.propTypes = {
  deployment: PropTypes.object
};

export const configureUpdateStrategyModal = createModalLauncher(ConfigureUpdateStrategyModal);
