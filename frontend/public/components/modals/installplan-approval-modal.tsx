/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent } from '../utils';
import { K8sKind, K8sResourceKind, modelFor, referenceFor, referenceForModel } from '../../module/k8s';
import { SubscriptionKind, InstallPlanApproval, InstallPlanKind } from '../cloud-services/index';
import { RadioInput } from '../radio';
import { SubscriptionModel, InstallPlanModel } from '../../models';

export class InstallPlanApprovalModal extends PromiseComponent {
  public state: InstallPlanApprovalModalState;

  constructor(public props: InstallPlanApprovalModalProps) {
    super(props);

    this.state.selectedApprovalStrategy = referenceFor(props.obj) === referenceForModel(SubscriptionModel) && _.get(props.obj, 'spec.installPlanApproval')
      || referenceFor(props.obj) === referenceForModel(InstallPlanModel) && _.get(props.obj, 'spec.approval')
      || InstallPlanApproval.Automatic;
  }

  private submit(event): void {
    event.preventDefault();

    let updatedObj = _.cloneDeep(this.props.obj);
    if (referenceFor(updatedObj) === referenceForModel(SubscriptionModel)) {
      (updatedObj as SubscriptionKind).spec.installPlanApproval = this.state.selectedApprovalStrategy;
    } else if (referenceFor(updatedObj) === referenceForModel(InstallPlanModel)) {
      (updatedObj as InstallPlanKind).spec.approval = this.state.selectedApprovalStrategy;
    }
    this.handlePromise(this.props.k8sUpdate(modelFor(referenceFor(this.props.obj)), updatedObj)).then(() => this.props.close());
  }

  render() {
    return <form onSubmit={this.submit.bind(this)} name="form">
      <ModalTitle className="modal-header">Change Update Approval Strategy</ModalTitle>
      <ModalBody>
        <div className="co-m-form-row">
          <p>What strategy is used for approving updates?</p>
        </div>
        <div className="co-m-form-row row">
          <div className="col-sm-12">
            <RadioInput
              onChange={(e) => this.setState({selectedApprovalStrategy: e.target.value})}
              value={InstallPlanApproval.Automatic}
              checked={this.state.selectedApprovalStrategy === InstallPlanApproval.Automatic}
              title={InstallPlanApproval.Automatic}
              subTitle="(default)">
              <div className="co-m-radio-desc">
                <p className="text-muted">
                  New updates will be installed as soon as they become available.
                </p>
              </div>
            </RadioInput>
          </div>
          <div className="col-sm-12">
            <RadioInput
              onChange={(e) => this.setState({selectedApprovalStrategy: e.target.value})}
              value={InstallPlanApproval.Manual}
              checked={this.state.selectedApprovalStrategy === InstallPlanApproval.Manual}
              title={InstallPlanApproval.Manual}>
              <div className="co-m-radio-desc">
                <p className="text-muted">
                  New updates need to be manually approved before installation begins.
                </p>
              </div>
            </RadioInput>
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter inProgress={this.state.inProgress} errorMessage={this.state.errorMessage} cancel={this.props.cancel.bind(this)} submitText="Save Channel" />
    </form>;
  }
}

export const createInstallPlanApprovalModal: (props: ModalProps) => {result: Promise<void>} = createModalLauncher(InstallPlanApprovalModal);

export type InstallPlanApprovalModalProps = {
  cancel: (e: Event) => void;
  close: () => void;
  k8sUpdate: (kind: K8sKind, newObj: K8sResourceKind) => Promise<any>;
  obj: InstallPlanKind | SubscriptionKind;
};

export type InstallPlanApprovalModalState = {
  inProgress: boolean;
  errorMessage: string;
  selectedApprovalStrategy: InstallPlanApproval;
};

type ModalProps = Omit<InstallPlanApprovalModalProps, 'cancel' | 'close'>;
