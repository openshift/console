/* eslint-disable no-undef, no-unused-vars */

import * as _ from 'lodash-es';
import * as React from 'react';

import { Dropdown, EmptyBox, PromiseComponent } from '../utils';
import { K8sKind, k8sPatch, Toleration, TolerationOperator } from '../../module/k8s';
import { createModalLauncher, ModalBody, ModalComponentProps, ModalSubmitFooter, ModalTitle } from '../factory';

class TolerationsModal extends PromiseComponent {
  readonly state: TolerationsModalState;

  constructor(public props: TolerationsModalProps) {
    super(props);
    this.state.tolerations = this._getTolerationsFromResource() || [];
  }

  _getTolerationsFromResource = (): Toleration[] => {
    const { resource } = this.props;
    return this.props.resourceKind.kind === 'Pod'
      ? resource.spec.tolerations
      : resource.spec.template.spec.tolerations;
  };

  _submit = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();

    const path = this.props.resourceKind.kind === 'Pod'
      ? '/spec/tolerations'
      : '/spec/template/spec/tolerations';

    // Remove the internal `isNew` property
    const tolerations = _.map(this.state.tolerations, t => _.omit(t, 'isNew'));

    // Make sure to 'add' if the path does not already exist, otherwise the patch request will fail
    const op = _.isEmpty(this._getTolerationsFromResource()) ? 'replace' : 'add';

    const patch = [{path, op, value: tolerations}];

    this.handlePromise(
      k8sPatch(this.props.resourceKind, this.props.resource, patch)
    ).then(this.props.close);
  };

  _cancel = () => {
    this.props.close();
  };

  _change = (e, i: number, field: string) => {
    const newValue = e.target ? e.target.value : e;
    this.setState((prevState: TolerationsModalState) => {
      const clonedTolerations = _.cloneDeep(prevState.tolerations);
      clonedTolerations[i][field] = newValue;
      return {
        tolerations: clonedTolerations,
      };
    });
  };

  _opChange = (op: TolerationOperator, i: number) => {
    this.setState((prevState: TolerationsModalState) => {
      const clonedTolerations = _.cloneDeep(prevState.tolerations);
      clonedTolerations[i].operator = op;
      if (op === 'Exists') {
        clonedTolerations[i].value = '';
      }
      return {
        tolerations: clonedTolerations,
      };
    });
  };

  _remove = (i: number) => {
    this.setState((state: TolerationsModalState) => {
      const tolerations = [...state.tolerations];
      tolerations.splice(i, 1);
      return { tolerations };
    });
  };

  _newToleration(): TolerationModalItem {
    return {key: '', operator: 'Exists', value: '', effect: '', isNew: true};
  }

  _addRow = () => {
    this.setState((state: TolerationsModalState) => ({
      tolerations: [...state.tolerations, this._newToleration()],
    }));
  };

  _isEditable = (t: TolerationModalItem) => {
    return this.props.resourceKind.kind !== 'Pod' || t.isNew;
  };

  render() {
    const operators = {
      'Exists': 'Exists',
      'Equal': 'Equal',
    };
    const effects = {
      '': 'All Effects',
      'NoSchedule': 'NoSchedule',
      'PreferNoSchedule': 'PreferNoSchedule',
      'NoExecute': 'NoExecute',
    };
    const { tolerations, errorMessage, inProgress } = this.state;
    return <form onSubmit={this._submit} name="form" className="modal-content toleration-modal">
      <ModalTitle>Edit Tolerations</ModalTitle>
      <ModalBody>
        {_.isEmpty(tolerations)
          ? <EmptyBox label="Tolerations" />
          : <React.Fragment>
            <div className="row hidden-sm hidden-xs">
              <div className="col-md-4 text-secondary text-uppercase">Key</div>
              <div className="col-md-2 text-secondary text-uppercase">Operator</div>
              <div className="col-md-3 text-secondary text-uppercase">Value</div>
              <div className="col-md-2 text-secondary text-uppercase">Effect</div>
              <div className="col-md-1"></div>
            </div>
            {_.map(tolerations, (t, i) => {
              const { key, operator, value, effect = '' } = t;
              return <div className="row" key={i}>
                <div className="col-md-4 col-sm-6 col-xs-6 toleration-modal__field">
                  <div className="hidden-md hidden-lg text-secondary text-uppercase">Key</div>
                  <input type="text" className="form-control" value={key} onChange={(e) => this._change(e, i, 'key')} readOnly={!this._isEditable(t)} />
                </div>
                <div className="col-md-2 col-sm-5 col-xs-5 toleration-modal__field">
                  <div className="hidden-md hidden-lg text-secondary text-uppercase">Operator</div>
                  { this._isEditable(t)
                    ? <Dropdown
                      className="toleration-modal__dropdown"
                      dropDownClassName="dropdown--full-width"
                      items={operators}
                      onChange={(op: TolerationOperator) => this._opChange(op, i)}
                      selectedKey={operator}
                      title={operators[operator]} />
                    : (<input type="text" className="form-control" value={operator} readOnly />)}
                </div>
                <div className="clearfix visible-sm visible-xs"></div>
                <div className="col-md-3 col-sm-6 col-xs-6 toleration-modal__field">
                  <div className="hidden-md hidden-lg text-secondary text-uppercase">Value</div>
                  <input
                    type="text"
                    className="form-control"
                    value={value}
                    onChange={(e) => this._change(e, i, 'value')}
                    readOnly={!this._isEditable(t) || operator === 'Exists'} />
                </div>
                <div className="col-md-2 col-sm-5 col-xs-5 toleration-modal__field">
                  <div className="hidden-md hidden-lg text-secondary text-uppercase">Effect</div>
                  { this._isEditable(t)
                    ? <Dropdown
                      className="toleration-modal__dropdown"
                      dropDownClassName="dropdown--full-width"
                      items={effects}
                      onChange={(e: string) => this._change(e, i, 'effect')}
                      selectedKey={effect}
                      title={effects[effect]} />
                    : <input type="text" className="form-control" value={effects[effect]} readOnly />}
                </div>
                <div className="col-md-1">
                  {this._isEditable(t) && (
                    <button type="button" className="btn btn-link btn-link--inherit-color toleration-modal__delete-icon" onClick={() => this._remove(i)} aria-label="Delete">
                      <i className="fa fa-minus-circle pairs-list__side-btn pairs-list__delete-icon" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>;
            })}
          </React.Fragment>
        }
        <button type="button" className="btn btn-link" onClick={this._addRow}>
          <i aria-hidden="true" className="fa fa-plus-circle pairs-list__add-icon" />Add More
        </button>
      </ModalBody>
      <ModalSubmitFooter errorMessage={errorMessage} inProgress={inProgress} submitText="Save" cancel={this._cancel} />
    </form>;
  }
}

export const tolerationsModal = createModalLauncher(TolerationsModal);

type TolerationModalItem = {
  // isNew is used internally in the dialog to track existing vs new
  // tolerations on pods and is not part of the k8s API
  isNew?: boolean;
} & Toleration;

type TolerationsModalProps = {
  resourceKind: K8sKind;
  resource: any;
  existingReadOnly?: boolean;
  modalClassName: string;
} & ModalComponentProps;

type TolerationsModalState = {
  tolerations: TolerationModalItem[];
  inProgress: boolean;
  errorMessage: string;
};
