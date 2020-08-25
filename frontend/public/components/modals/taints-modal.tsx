import * as _ from 'lodash-es';
import * as React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';

import { Dropdown, EmptyBox, PromiseComponent } from '../utils';
import { K8sKind, k8sPatch, NodeKind, Taint } from '../../module/k8s';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '../factory';

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
    const patch = [{ path: '/spec/taints', op, value: taints }];

    this.handlePromise(k8sPatch(this.props.resourceKind, this.props.resource, patch)).then(
      this.props.close,
    );
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
    return { key: '', value: '', effect: 'NoSchedule' };
  }

  _addRow = () => {
    this.setState((state: TaintsModalState) => ({
      taints: [...state.taints, this._newTaint()],
    }));
  };

  render() {
    const effects = {
      NoSchedule: 'NoSchedule',
      PreferNoSchedule: 'PreferNoSchedule',
      NoExecute: 'NoExecute',
    };
    const { taints, errorMessage, inProgress } = this.state;
    return (
      <form
        onSubmit={this._submit}
        name="form"
        className="modal-content modal-content--accommodate-dropdown taint-modal"
      >
        <ModalTitle>Edit Taints</ModalTitle>
        <ModalBody>
          {_.isEmpty(taints) ? (
            <EmptyBox label="Taints" />
          ) : (
            <>
              <div className="row taint-modal__heading hidden-sm hidden-xs">
                <div className="col-sm-4 text-secondary text-uppercase">Key</div>
                <div className="col-sm-3 text-secondary text-uppercase">Value</div>
                <div className="col-sm-4 text-secondary text-uppercase">Effect</div>
                <div className="col-sm-1 co-empty__header" />
              </div>
              {_.map(taints, (c, i) => (
                <div className="row taint-modal__row" key={i}>
                  <div className="col-md-4 col-xs-5 taint-modal__field">
                    <div className="taint-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                      Key
                    </div>
                    <input
                      type="text"
                      className="pf-c-form-control taint-modal__input"
                      value={c.key}
                      onChange={(e) => this._change(e, i, 'key')}
                      required
                    />
                  </div>
                  <div className="col-md-3 col-xs-5 taint-modal__field">
                    <div className="taint-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                      Value
                    </div>
                    <input
                      type="text"
                      className="pf-c-form-control taint-modal__input"
                      value={c.value}
                      onChange={(e) => this._change(e, i, 'value')}
                    />
                  </div>
                  <div className="clearfix visible-sm visible-xs" />
                  <div className="col-md-4 col-xs-5 taint-modal__field">
                    <div className="taint-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                      Effect
                    </div>
                    <Dropdown
                      className="taint-modal__dropdown"
                      dropDownClassName="dropdown--full-width"
                      items={effects}
                      onChange={(e) => this._change(e, i, 'effect')}
                      selectedKey={c.effect}
                      title={effects[c.effect]}
                    />
                  </div>
                  <div className="col-md-1 col-md-offset-0 col-sm-offset-10 col-xs-offset-10">
                    <Tooltip content="Remove">
                      <Button
                        type="button"
                        className="taint-modal__delete-icon"
                        onClick={() => this._remove(i)}
                        aria-label="Remove"
                        variant="plain"
                      >
                        <MinusCircleIcon className="pairs-list__side-btn pairs-list__delete-icon" />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </>
          )}
          <Button
            className="pf-m-link--align-left"
            onClick={this._addRow}
            type="button"
            variant="link"
          >
            <PlusCircleIcon data-test-id="pairs-list__add-icon" className="co-icon-space-r" />
            Add More
          </Button>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={errorMessage}
          inProgress={inProgress}
          submitText="Save"
          cancel={this._cancel}
        />
      </form>
    );
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
