import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { Button } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';

export class ListInput extends React.Component<ListInputProps, ListInputState> {
  private helpID: string = _.uniqueId('list-view-help-');
  constructor(props: ListInputProps) {
    super(props);
    this.state = {
      values: props.initialValues || [''],
    };
  }

  componentDidUpdate(prevProps: ListInputProps, prevState: ListInputState) {
    if (prevState.values !== this.state.values) {
      const values = _.compact(this.state.values);
      this.props.onChange(values);
    }
  }

  valueChanged(i: number, v: string) {
    this.setState(state => {
      const values = [...state.values];
      values[i] = v;
      return { values };
    });
  }

  addValue() {
    this.setState(state => ({ values: [...state.values, '']}));
  }

  removeValue(i: number) {
    this.setState(state => {
      const values = [...state.values];
      values.splice(i, 1);
      return {
        values: _.isEmpty(values) ? [''] : values,
      };
    });
  }

  render() {
    const { label, required, helpText } = this.props;
    const { values } = this.state;
    const missingValues = required && (_.isEmpty(values) || _.every(values, v => !v));
    return (
      <div className="form-group">
        <label className={classNames('control-label', { 'co-required': required })}>{label}</label>
        {_.map(values, (v: string, i: number) => (
          <div className="co-list-input__row" key={i}>
            <div className="co-list-input__value">
              <input
                className="pf-c-form-control"
                type="text"
                value={v}
                onChange={(e: React.FormEvent<HTMLInputElement>) => this.valueChanged(i, e.currentTarget.value)}
                required={missingValues && i === 0}
                aria-describedby={helpText ? this.helpID : undefined} />
            </div>
            <div className="co-list-input__remove-btn">
              <button type="button" className="btn btn-link btn-link--inherit-color" onClick={() => this.removeValue(i)} aria-label="Remove">
                <i className="fa fa-minus-circle pairs-list__side-btn pairs-list__delete-icon" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
        {helpText && <div className="co-list-input__help-block help-block" id={this.helpID}>{helpText}</div>}
        <Button
          className="pf-m-link--align-left"
          onClick={() => this.addValue()}
          type="button"
          variant="link">
          <PlusCircleIcon /> Add More
        </Button>
      </div>
    );
  }
}

type ListInputState = {
  values: string[];
};

type ChangeCallback = (values: string[]) => void;

type ListInputProps = {
  label: string;
  initialValues?: string[];
  onChange: ChangeCallback;
  helpText?: string;
  required?: boolean;
};
