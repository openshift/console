import React from 'react';

import { k8sKinds, k8sPatch } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent } from '../utils';

const ReplicaRow = ({label, id, value, min, max, onChange, autoFocus}) => <div className="row co-m-form-row">
  <div className="col-xs-12">
    <label className="modal__input--label" htmlFor={id}>{label}</label>
    <input id={id} type="number"
      className="form-control modal__input--with-units"
      value={value}
      min={min}
      max={max}
      onChange={onChange}
      required autoFocus={autoFocus} />
    <span>replicas</span>
  </div>
</div>;

class ConfigureHPAReplicasModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._change = this._change.bind(this);
    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);
    this.state = Object.assign(this.state, {
      minReplicas: _.get(this.props.resource.spec, 'minReplicas'),
      maxReplicas: _.get(this.props.resource.spec, 'maxReplicas')
    });
  }

  _change(event) {
    const id = event.target.id;
    const value = event.target.value;

    if (id === 'min-replicas') {
      this.setState({ minReplicas: value });
    } else {
      this.setState({ maxReplicas: value });
    }
  }

  _submit(event) {
    event.preventDefault();

    const patch = [
      { op: 'replace', path: '/spec/minReplicas', value: _.toSafeInteger(this.state.minReplicas) },
      { op: 'replace', path: '/spec/maxReplicas', value: _.toSafeInteger(this.state.maxReplicas) },
    ];

    this.handlePromise(
      k8sPatch(k8sKinds.HORIZONTALPODAUTOSCALER, this.props.resource, patch)
    ).then(this.props.close);
  }

  render() {
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Modify Replica Limits</ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">
          <p>
            Use replica limits to prevent an autoscaler from consuming too many resources, or removing all of your replicas. The autoscaler will react to your desired resource targets within this range.
          </p>
        </div>
        <ReplicaRow label="Minimum" id="min-replicas" value={this.state.minReplicas} min="1" max={this.state.maxReplicas} autoFocus="true" onChange={this._change} />
        <ReplicaRow label="Maximum" id="max-replicas" value={this.state.maxReplicas} onChange={this._change} />
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={this.state.errorMessage}
        inProgress={this.state.inProgress}
        submitText="Save Replica Limits"
        cancel={this._cancel} />
    </form>;
  }
}

ConfigureHPAReplicasModal.propTypes = {
  resource: React.PropTypes.object
};

export const configureHPAReplicasModal = createModalLauncher(ConfigureHPAReplicasModal);
