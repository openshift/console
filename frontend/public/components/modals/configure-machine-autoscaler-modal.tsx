import * as React from 'react';
import * as _ from 'lodash-es';

import { MachineAutoscalerModel } from '../../models';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { history, NumberSpinner, PromiseComponent, resourcePathFromModel } from '../utils';
import { k8sCreate, K8sResourceKind } from '../../module/k8s';

export class ConfigureMachineAutoscalerModal extends PromiseComponent<ConfigureMachineAutoscalerModalProps, ConfigureMachineAutoscalerModalState> {
  readonly state: ConfigureMachineAutoscalerModalState = {
    inProgress: false,
    errorMessage: '',
    minReplicas: 1,
    maxReplicas: 12,
  };

  changeMinReplicas = (event) => {
    const minReplicas = _.toInteger(event.target.value);
    this.setState({minReplicas});
  };

  changeMinReplicasBy = (operation) => {
    const minReplicas = this.state.minReplicas + operation;
    this.setState({minReplicas});
  };

  changeMaxReplicas = (event) => {
    const maxReplicas = _.toInteger(event.target.value);
    this.setState({maxReplicas});
  };

  changeMaxReplicasBy = (operation) => {
    const maxReplicas = this.state.maxReplicas + operation;
    this.setState({maxReplicas});
  };

  createAutoscaler = (): Promise<K8sResourceKind> => {
    const { apiVersion, kind, metadata: { name, namespace } } = this.props.machineSet;
    const { minReplicas, maxReplicas } = this.state;

    const machineAutoscaler = {
      apiVersion: 'autoscaling.openshift.io/v1beta1',
      kind: 'MachineAutoscaler',
      metadata: {
        name,
        namespace,
      },
      spec: {
        minReplicas,
        maxReplicas,
        scaleTargetRef: {
          apiVersion,
          kind,
          name,
        },
      },
    };

    return k8sCreate(MachineAutoscalerModel, machineAutoscaler);
  };

  submit = (event): void => {
    event.preventDefault();
    const { close } = this.props;
    const promise = this.createAutoscaler();
    this.handlePromise(promise).then((obj: K8sResourceKind) => {
      close();
      history.push(resourcePathFromModel(MachineAutoscalerModel, obj.metadata.name, obj.metadata.namespace));
    });
  };

  render() {
    const {name} = this.props.machineSet.metadata;

    return <form onSubmit={this.submit} name="form" className="modal-content">
      <ModalTitle className="modal-header">Create Machine Autoscaler</ModalTitle>
      <ModalBody>
        <p>
          This will automatically scale machine set <b>{name}</b>.
        </p>
        <div className="form-group">
          <label className="co-delete-modal-checkbox-label">
            Minimum Replicas:
            <NumberSpinner className="pf-c-form-control" value={this.state.minReplicas} onChange={this.changeMinReplicas} changeValueBy={this.changeMinReplicasBy} autoFocus required />
          </label>
        </div>
        <div className="form-group">
          <label className="co-delete-modal-checkbox-label">
            Maximum Replicas:
            <NumberSpinner className="pf-c-form-control" value={this.state.maxReplicas} onChange={this.changeMaxReplicas} changeValueBy={this.changeMaxReplicasBy} required />
          </label>
        </div>
      </ModalBody>
      <ModalSubmitFooter inProgress={this.state.inProgress} errorMessage={this.state.errorMessage} cancel={this.props.cancel} submitText="Create" />
    </form>;
  }
}

export const configureMachineAutoscalerModal = createModalLauncher(ConfigureMachineAutoscalerModal);

export type ConfigureMachineAutoscalerModalProps = {
  machineSet: K8sResourceKind;
  cancel: (e: Event) => void;
  close: () => void;
};

export type ConfigureMachineAutoscalerModalState = {
  inProgress: boolean;
  errorMessage: string;
  minReplicas: number;
  maxReplicas: number;
};
