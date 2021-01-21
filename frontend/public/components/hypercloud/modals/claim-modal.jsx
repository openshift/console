import * as _ from 'lodash-es';
import { ValidTabGuard } from 'packages/kubevirt-plugin/src/components/create-vm-wizard/tabs/valid-tab-guard';
import * as React from 'react';

import { k8sUpdateClaim, referenceForModel } from '../../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../../factory/modal';
import { PromiseComponent, ResourceIcon, SelectorInput } from '../../utils';

const STATUS_PATH = '/status/phase';
const REASON_PATH = '/status/reason';
// const STATUS_PATH = '/status';
const TEMPLATE_SELECTOR_PATH = '/spec/template/metadata/status';

class BaseClaimModal extends PromiseComponent {
    constructor(props) {
        super(props);
        this._submit = this._submit.bind(this);
        this._cancel = props.cancel.bind(this);
        let status = _.get(props.resource, props.path.split('/').slice(1));
        if (status === 'Awaiting') {
            status = 'Approved';
        }
        const reason = _.get(props.resource, props.reasonPath.split('/').slice(1));
        this.state = Object.assign(this.state, {
            status,
            reason
        });
    }

    _submit(e) {
        e.preventDefault();

        const { kind, resource } = this.props;
        const clusterClaim = resource.metadata.name;

        // resourceURL
        const admit = this.state.status === 'Approved' ? true : false;

        const reason = this.state.reason;

        const promise = k8sUpdateClaim(kind, clusterClaim, admit, reason);
        this.handlePromise(promise)
            .then(this.successSubmit);
    }

    successSubmit = () => {
        this.props.close();
        location.reload();
    }

    onChangeApproval = (e) => {
        this.setState({ status: e.target.value });
    }

    onChangeReason = (e) => {
        this.setState({ reason: e.target.value });
    }

    render() {
        const { kind, resource, description, message } = this.props;

        return (
            <form onSubmit={this._submit} name="form" className="modal-content">
                <ModalTitle>Approval Processing</ModalTitle>
                <ModalBody>
                    <div className="row co-m-form-row">
                        <div className="col-sm-12">
                            {message || ''}
                        </div>
                    </div>
                    <div className="row co-m=-form-row">
                        <div className="col-sm-12" style={{ marginBottom: '15px' }}>
                            <select className="col-sm-12" value={this.state.status} onChange={this.onChangeApproval}>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                        <div className="col-sm-12">
                            <textarea className="col-sm-12" style={{ height: '100px' }} onChange={this.onChangeReason} value={this.state.reason} />
                        </div>
                        <div className="col-sm-12">
                            Please enter a reason for refusal.
                        </div>
                    </div>
                </ModalBody>
                <ModalSubmitFooter
                    errorMessage={this.state.errorMessage}
                    inProgress={this.state.inProgress}
                    submitText="Confirm"
                    cancel={this._cancel}
                />
            </form>
        )
    }
}

export const claimModal = createModalLauncher((props) => (
    <BaseClaimModal path={STATUS_PATH} reasonPath={REASON_PATH} {...props} />
));