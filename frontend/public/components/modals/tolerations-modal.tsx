/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { PromiseComponent, Dropdown } from '../utils';
import { K8sKind, k8sPatch } from '../../module/k8s';

import { createModalLauncher, ModalBody, ModalComponentProps, ModalSubmitFooter, ModalTitle } from '../factory';
import * as _ from 'lodash-es';

class TolerationsModal extends PromiseComponent {
  readonly state: TolerationsModalState;

  constructor(public props: TolerationsModalProps) {
    super(props);
    this.state.tolerations = this._getTolerationsFromResource() || [];
  }

  _getTolerationsFromResource = () => {
    return _.isEqual(this.props.resourceKind.kind,'Pod') ? this.props.resource.spec.tolerations : this.props.resource.spec.template.spec.tolerations;
  };

  _submit = (e) => {
    e.preventDefault();

    const path = _.isEqual(this.props.resourceKind.kind,'Pod') ? '/spec/tolerations' : '/spec/template/spec/tolerations';

    const { tolerations } = this.state;

    // Make sure to 'add' if the path does not already exist, otherwise the patch request will fail
    const op = this._getTolerationsFromResource() ? 'replace' : 'add';

    const patch = [{path, op, value: tolerations}];

    this.handlePromise(
      k8sPatch(this.props.resourceKind, this.props.resource, patch)
    ).then(this.props.close);
  };

  _cancel = () => {
    this.props.close();
  };

  _change = (e, i, field) => {
    const newValue = e.target ? e.target.value : e;
    this.setState((prevState: TolerationsModalState) => {
      const clonedToleration = _.cloneDeep(prevState.tolerations);
      clonedToleration[i][field] = newValue;
      return {
        tolerations: clonedToleration,
      };
    });
  };

  _remove = (i) => {
    this.setState((prevState: TolerationsModalState) => {
      const clonedToleration = _.cloneDeep(prevState.tolerations);
      clonedToleration.splice(i, 1);
      return {
        tolerations: clonedToleration,
      };
    });
  };

  _addRow = () => {
    this.setState((prevState: TolerationsModalState) => ({
      tolerations: [...prevState.tolerations, {key: '', operator: 'Exists', value: '', effect: '', isNew: true}],
    }));
  };

  _isEditable = (t) => {
    return this.props.resourceKind.kind !== 'Pod' || t.isNew;
  };

  render() {
    const operators = {
      'Exists': 'Exists',
      'Equal': 'Equal',
    };
    const effects = {
      '': '',
      'NoSchedule': 'NoSchedule',
      'PreferNoSchedule': 'PreferNoSchedule',
      'NoExecute': 'NoExecute',
    };
    return <form onSubmit={this._submit} name="form" className="modal-content toleration-modal">
      <ModalTitle>Edit Tolerations</ModalTitle>
      <ModalBody>
        <div className="row hidden-sm hidden-xs">
          <div className="col-md-4 text-secondary text-uppercase">Key</div>
          <div className="col-md-2 text-secondary text-uppercase">Operator</div>
          <div className="col-md-3 text-secondary text-uppercase">Value</div>
          <div className="col-md-2 text-secondary text-uppercase">Effect</div>
          <div className="col-md-1"></div>
        </div>
        {_.map(this.state.tolerations, (t, i) => {
          return <div className="row">
            <div className="col-md-4 col-sm-6 col-xs-6 toleration-modal__field">
              <div className="hidden-md hidden-lg text-secondary text-uppercase">Key</div>
              <input type="text" className="form-control" value={t.key} onChange={(e) => this._change(e, i, 'key')} readOnly={!this._isEditable(t)} />
            </div>
            <div className="col-md-2 col-sm-5 col-xs-5 toleration-modal__field">
              <div className="hidden-md hidden-lg text-secondary text-uppercase">Operator</div>
              { this._isEditable(t) ?
                (<Dropdown
                  className="toleration-modal__dropdown"
                  dropDownClassName="dropdown--full-width"
                  items={operators}
                  onChange={(e) => this._change(e, i, 'operator')}
                  selectedKey={t.operator} />)
                : (<input type="text" className="form-control" value={t.operator} readOnly />)}
            </div>
            <div className="clearfix visible-sm visible-xs"></div>
            <div className="col-md-3 col-sm-6 col-xs-6 toleration-modal__field">
              <div className="hidden-md hidden-lg text-secondary text-uppercase">Value</div>
              <input type="text" className="form-control" value={t.value} onChange={(e) => this._change(e, i, 'value')} readOnly={!this._isEditable(t)} />
            </div>
            <div className="col-md-2 col-sm-5 col-xs-5 toleration-modal__field">
              <div className="hidden-md hidden-lg text-secondary text-uppercase">Effect</div>
              { this._isEditable(t) ?
                (<Dropdown
                  className="toleration-modal__dropdown"
                  dropDownClassName="dropdown--full-width"
                  items={effects}
                  onChange={(e) => this._change(e, i, 'effect')}
                  selectedKey={t.effect} />)
                : (<input type="text" className="form-control" value={t.effect} readOnly />)}
            </div>
            <div className="col-md-1">
              {this._isEditable(t) &&
              <button type="button" className="btn btn-link toleration-modal__delete-icon" onClick={() => this._remove(i)}>
                <i className="fa fa-minus-circle pairs-list__side-btn pairs-list__delete-icon" aria-hidden="true"></i>
                <span className="sr-only">Delete</span>
              </button>
              }
            </div>
          </div>;
        })}
        <button type="button" className="btn btn-link" onClick={this._addRow}>
          <i aria-hidden="true" className="fa fa-plus-circle pairs-list__add-icon" />Add More
        </button>
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText="Save" cancel={this._cancel} />
    </form>;
  }
}

export const tolerationsModal = createModalLauncher(TolerationsModal);

type Toleration = {
  key: string;
  operator: string;
  value: string;
  effect: string;
  isNew?: boolean;
};

type TolerationsModalProps = {
  resourceKind: K8sKind;
  resource: any;
  modalClassName: string;
} & ModalComponentProps;

type TolerationsModalState = {
  tolerations: Toleration[];
  inProgress: boolean;
  errorMessage: string;
};
