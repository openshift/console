import React from 'react';

import { k8sKinds, k8sPatch } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent } from '../utils';

class ConfigureHPATargetsModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);
  }

  _submit(event) {
    event.preventDefault();

    const patch = [{
      op: 'replace', path: '/spec/cpuUtilization/targetPercentage',
      value: _.toNumber(event.target.elements.percentage.value)
    }];

    this.handlePromise(
      k8sPatch(k8sKinds.HORIZONTALPODAUTOSCALER, this.props.resource, patch)
    ).then(this.props.close);
  }

  render() {
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Modify Resource Targets</ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">
          <p>
            The autoscaler will scale pods up or down automatically, to maintain the desired resource targets. When using multiple targets, the autoscaler is generous and will pursue the largest number of replicas, to provide resources for all constrained targets.
          </p>
        </div>
        <div className="row co-m-form-row">
          <div className="col-xs-12">
            <label htmlFor="percentage">Target CPU Utilization</label>
            <input id="percentage"
              defaultValue={_.get(this.props.resource.spec, 'cpuUtilization.targetPercentage')}
              autoFocus="true" min="1" max="100" type="number"
              className="form-control modal__input--with-label modal__input--with-units" required />
            <span>percent</span>
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={this.state.errorMessage}
        inProgress={this.state.inProgress}
        submitText="Save Resource Targets"
        cancel={this._cancel} />
    </form>;
  }
}

ConfigureHPATargetsModal.propTypes = {
  resource: React.PropTypes.object
};

export const configureHPATargetsModal = createModalLauncher(ConfigureHPATargetsModal);
