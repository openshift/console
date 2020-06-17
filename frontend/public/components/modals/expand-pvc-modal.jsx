import * as React from 'react';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent, RequestSizeInput, resourceObjPath, history, validate } from '../utils';
import { k8sPatch, referenceFor } from '../../module/k8s/';
import { getRequestedPVCSize } from '@console/shared';

// Modal for expanding persistent volume claims
class ExpandPVCModal extends PromiseComponent {
  constructor(props) {
    super(props);
    const defaultSize = validate.split(getRequestedPVCSize(props.resource));
    this.state = {
      inProgress: false,
      errorMessage: '',
      requestSizeValue: defaultSize[0] || '',
      requestSizeUnit: defaultSize[1] || 'Gi',
    };
    this._handleRequestSizeInputChange = this._handleRequestSizeInputChange.bind(this);
    this._cancel = this.props.cancel.bind(this);
    this._submit = this._submit.bind(this);
  }

  _handleRequestSizeInputChange(obj) {
    this.setState({ requestSizeValue: obj.value, requestSizeUnit: obj.unit });
  }

  _submit(e) {
    e.preventDefault();
    const { requestSizeUnit, requestSizeValue } = this.state;
    const patch = [
      {
        op: 'replace',
        path: '/spec/resources/requests',
        value: { storage: `${requestSizeValue}${requestSizeUnit}` },
      },
    ];
    this.handlePromise(k8sPatch(this.props.kind, this.props.resource, patch)).then((resource) => {
      this.props.close();
      // redirected to the details page for persitent volume claim
      history.push(resourceObjPath(resource, referenceFor(resource)));
    });
  }

  render() {
    const { kind, resource } = this.props;
    const dropdownUnits = {
      Mi: 'MiB',
      Gi: 'GiB',
      Ti: 'TiB',
    };
    const { requestSizeUnit, requestSizeValue } = this.state;
    return (
      <form
        onSubmit={this._submit}
        name="form"
        className="modal-content modal-content--no-inner-scroll"
      >
        <ModalTitle>Expand {kind.label}</ModalTitle>
        <ModalBody>
          <p>
            Increase the capacity of claim{' '}
            <strong className="co-break-word">{resource.metadata.name}.</strong> This can be a
            time-consuming process.
          </p>
          <label className="control-label co-required">Size</label>
          <RequestSizeInput
            name="requestSize"
            required
            onChange={this._handleRequestSizeInputChange}
            defaultRequestSizeUnit={requestSizeUnit}
            defaultRequestSizeValue={requestSizeValue}
            dropdownUnits={dropdownUnits}
          />
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={this.state.errorMessage}
          inProgress={this.state.inProgress}
          submitText="Expand"
          cancel={this._cancel}
        />
      </form>
    );
  }
}

export const expandPVCModal = createModalLauncher(ExpandPVCModal);
