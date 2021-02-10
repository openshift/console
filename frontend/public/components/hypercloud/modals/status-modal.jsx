import * as _ from 'lodash-es';
import { switchPerspective } from 'packages/dev-console/integration-tests/views/dev-perspective.view';
import { ValidTabGuard } from 'packages/kubevirt-plugin/src/components/create-vm-wizard/tabs/valid-tab-guard';
import * as React from 'react';
import classNames from 'classnames';
import { NamespaceClaimModel, ResourceQuotaClaimModel } from '../../../models';
import { k8sUpdateApproval, referenceForModel } from '../../../module/k8s';
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../../factory/modal';
import { PromiseComponent, ResourceIcon, SelectorInput } from '../../utils';

const STATUS_PATH = '/status/result';
const REASON_PATH = '/status/reason';
// const STATUS_PATH = '/status';
const TEMPLATE_SELECTOR_PATH = '/spec/template/metadata/status';

class BaseStatusModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._submit = this._submit.bind(this);
    this._cancel = props.cancel.bind(this);
    // let status = _.get(props.resource, props.path.split('/').slice(1));
    let status = '';
    // if (status === 'Waiting') {
    //   status = 'Approved';
    // }
    // const reason = _.get(props.resource, props.reasonPath.split('/').slice(1));
    const reason = '';
    this.state = Object.assign(this.state, {
      status,
      reason,
      isOptionsOpen: false,
    });
    this.options = [
      { value: 'Approved', disabled: false },
      { value: 'Rejected', disabled: false },
    ];
  }

  _submit(e) {
    e.preventDefault();

    const { kind, path, resource } = this.props;
    switch (kind.kind) {
      case ResourceQuotaClaimModel.kind:
      case NamespaceClaimModel.kind: {
        const stat = this.state.status === 'Approved' ? 'Success' : 'Reject';
        const promise = k8sUpdateApproval(
          kind,
          resource,
          'status',
          {
            status: {
              status: stat,
              reason: this.state.reason,
            },
          },
          'PATCH',
        );
        this.handlePromise(promise).then(this.successSubmit);
        break;
      }
      default: {
        // resourceURL
        const approval = this.state.status === 'Approved' ? 'approve' : 'reject';

        const promise = k8sUpdateApproval(kind, resource, approval, {
          reason: this.state.reason,
        });
        this.handlePromise(promise).then(this.successSubmit);
        break;
      }
    }
  }

  successSubmit = () => {
    this.props.close();
    // location.reload();
  };

  onChangeApproval = e => {
    this.setState({ status: e.target.value });
  };

  onSelect = (event, selection) => {
    this.setState({ status: selection, isOptionsOpen: false });
  };

  onToggle = isOpen => {
    this.setState({ isOptionsOpen: isOpen });
  };

  onChangeReason = e => {
    this.setState({ reason: e.target.value });
  };

  render() {
    const { kind, resource, description, message } = this.props;

    return (
      <form onSubmit={this._submit} name="form" className="modal-content">
        <ModalTitle>Approval Processing</ModalTitle>
        <ModalBody>
          <div className="row co-m-form-row">
            <div className="col-sm-12">{message || ''}</div>
          </div>
          <div className="row co-m=-form-row">
            <div
              className={classNames('col-sm-12', 'approval-dropdown--short-bottom', {
                'approval-dropdown--long-bottom': this.state.status !== 'Rejected',
              })}
            >
              {/* <select className="col-sm-12" value={this.state.status} onChange={this.onChangeApproval}>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select> */}
              <Select variant={SelectVariant.single} placeholderText="Select status" selections={this.state.status} onSelect={this.onSelect} onToggle={this.onToggle} isExpanded={this.state.isOptionsOpen} isDisabled={false}>
                {this.options.map((option, index) => (
                  <SelectOption isDisabled={option.disabled} key={index} value={option.value} />
                ))}
              </Select>
            </div>
            {this.state.status === 'Rejected' ? (
              <div>
                <div className="col-sm-12">
                  <textarea className="col-sm-12 pf-c-form-control query-browser__query-input" style={{ height: '100px' }} onChange={this.onChangeReason} value={this.state.reason} />
                </div>
                <div className="col-sm-12">Please enter a reason for refusal.</div>
              </div>
            ) : null}
          </div>
        </ModalBody>
        <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText="Confirm" cancel={this._cancel} />
      </form>
    );
  }
}

export const statusModal = createModalLauncher(props => <BaseStatusModal path={STATUS_PATH} reasonPath={REASON_PATH} {...props} />);
