import * as _ from 'lodash-es';
import * as React from 'react';

import { Dropdown, EmptyBox, PromiseComponent } from '../utils';
import { K8sKind, k8sPatch, NodeKind, Taint } from '../../module/k8s';
import { createModalLauncher, ModalBody, ModalComponentProps, ModalSubmitFooter, ModalTitle } from '../factory';

class TaintsModal extends PromiseComponent<TaintsModalProps, TaintsModalState> {
  readonly state: TaintsModalState;

  constructor(public props: TaintsModalProps) {
    super(props);
    // Add an empty row for editing if no taints exist.
    this.state.taints = this.props.resource.spec.taints || [];
  }

  _submit = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();

    const { taints } = this.state;

    // Make sure to 'add' if the path does not already exist, otherwise the patch request will fail
    const op = this.props.resource.spec.taints ? 'replace' : 'add';
    const patch = [{path: '/spec/taints', op, value: taints}];

    this.handlePromise(
      k8sPatch(this.props.resourceKind, this.props.resource, patch)
    ).then(this.props.close);
  };

  _cancel = () => {
    this.props.close();
  };

  _change = (e, i: number, field: string) => {
    const newValue = e.target ? e.target.value : e;
    this.setState((prevState: TaintsModalState) => {
      const clonedTaints = _.cloneDeep(prevState.taints);
      clonedTaints[i][field] = newValue;
      return {
        taints: clonedTaints,
      };
    });
  };

  _remove = (i: number) => {
    this.setState((state: TaintsModalState) => {
      const taints = [...state.taints];
      taints.splice(i, 1);
      return { taints };
    });
  };

  _newTaint(): Taint {
    return {key: '', value: '', effect: 'NoSchedule'};
  }

  _addRow = () => {
    this.setState((state: TaintsModalState) => ({
      taints: [...state.taints, this._newTaint()],
    }));
  };

  render() {
    const effects = {
      'NoSchedule': 'NoSchedule',
      'PreferNoSchedule': 'PreferNoSchedule',
      'NoExecute': 'NoExecute',
    };
    const { taints, errorMessage, inProgress } = this.state;
    return <form onSubmit={this._submit} name="form" className="modal-content modal-content--accommodate-dropdown taint-modal">
      <ModalTitle>Edit Taints</ModalTitle>
      <ModalBody>
        {_.isEmpty(taints)
          ? <EmptyBox label="Taints" />
          : <React.Fragment>
            <div className="row hidden-sm hidden-xs">
              <div className="col-sm-4 text-secondary text-uppercase">Key</div>
              <div className="col-sm-3 text-secondary text-uppercase">Value</div>
              <div className="col-sm-4 text-secondary text-uppercase">Effect</div>
              <div className="col-sm-1 co-empty__header"></div>
            </div>
            {_.map(taints, (c, i) =>
              <div className="row" key={i}>
                <div className="col-md-4 col-sm-6 col-xs-6 taint-modal__field">
                  <div className="hidden-md hidden-lg text-secondary text-uppercase">Key</div>
                  <input type="text" className="form-control" value={c.key} onChange={(e) => this._change(e, i, 'key')} required />
                </div>
                <div className="col-md-3 col-sm-5 col-xs-5 taint-modal__field">
                  <div className="hidden-md hidden-lg text-secondary text-uppercase">Value</div>
                  <input type="text" className="form-control" value={c.value} onChange={(e) => this._change(e, i, 'value')} />
                </div>
                <div className="clearfix visible-sm visible-xs"></div>
                <div className="col-md-4 col-sm-6 col-xs-6 taint-modal__field">
                  <div className="hidden-md hidden-lg text-secondary text-uppercase">Effect</div>
                  <Dropdown
                    className="taint-modal__dropdown"
                    dropDownClassName="dropdown--full-width"
                    items={effects}
                    onChange={(e) => this._change(e, i, 'effect')}
                    selectedKey={c.effect}
                    title={effects[c.effect]} />
                </div>
                <div className="col-md-1 col-md-offset-0 col-sm-offset-11 col-xs-offset-11">
                  <button type="button" className="btn btn-link taint-modal__delete-icon" onClick={() => this._remove(i)} aria-label="Delete">
                    <i className="fa fa-minus-circle pairs-list__side-btn pairs-list__delete-icon" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </React.Fragment>}
        <button type="button" className="btn btn-link" onClick={this._addRow}>
          <i aria-hidden="true" className="fa fa-plus-circle pairs-list__add-icon" />Add More
        </button>
      </ModalBody>
      <ModalSubmitFooter errorMessage={errorMessage} inProgress={inProgress} submitText="Save" cancel={this._cancel} />
    </form>;
  }
}

export const taintsModal = createModalLauncher(TaintsModal);

type TaintsModalProps = {
  resourceKind: K8sKind;
  resource: NodeKind;
} & ModalComponentProps;

type TaintsModalState = {
  taints: Taint[];
  inProgress: boolean;
  errorMessage: string;
};
