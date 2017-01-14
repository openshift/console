import React from 'react';

import { angulars } from '../react-wrapper';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { RadioInput } from './_radio';

class ConfigurePullPolicyModal extends React.Component {
  constructor(props) {
    super(props);

    this._cancel = this.props.cancel.bind(this);
    this._submit = this._submit.bind(this);
    this._change = this._change.bind(this);

    this.policies = _.sortBy(_.values(angulars.k8s.enum.PullPolicy), 'weight');

    const policy = angulars.k8s.docker.getPullPolicyByValue(this.props.container.imagePullPolicy).id;

    this.state = {
      policy
    };
  }

  _change(event) {
    this.setState({
      policy: event.target.value
    });
  }

  _submit(event) {
    event.preventDefault();
    const policy = angulars.k8s.docker.getPullPolicyById(this.state.policy).value;
    this.props.close(policy);
  }

  render() {
    return <form onSubmit={this._submit} name="form">
      <ModalTitle>Configure Pull Policy</ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">
          <p>Each time a new pod is created by the replication controller, it needs to know how to fetch the container image(s):</p>
        </div>

        {_.map(this.policies, (policy) => {
          const id = policy.id;
          const title = policy.default ? <span>{policy.label} <span className="co-no-bold">(default)</span></span> : policy.label;

          return <div className="co-m-form-row" key={id}>
            <RadioInput onChange={this._change} value={id} checked={this.state.policy === id} title={title} desc={policy.description} />
          </div>;
        })}
      </ModalBody>
      <ModalSubmitFooter submitText="Save Pull Policy" cancel={this._cancel} />
    </form>;
  }
}
ConfigurePullPolicyModal.propTypes = {
  container: React.PropTypes.object
};

export const configurePullPolicyModal = createModalLauncher(ConfigurePullPolicyModal);
