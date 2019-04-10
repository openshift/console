/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';

export class ListInput extends React.Component<ListInputProps, ListInputState> {
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
    const { label } = this.props;
    const { values } = this.state;
    return (
      <div className="form-group">
        <label className="control-label">{label}</label>
        {_.map(values, (v: string, i: number) => (
          <div className="co-list-input__row" key={i}>
            <div className="co-list-input__value">
              <input className="form-control" type="text" value={v} onChange={(e: React.FormEvent<HTMLInputElement>) => this.valueChanged(i, e.currentTarget.value)} />
            </div>
            <div className="co-list-input__remove-btn">
              <button type="button" className="btn btn-link btn-link--inherit-color" onClick={() => this.removeValue(i)} aria-label="Remove">
                <i className="fa fa-minus-circle pairs-list__side-btn pairs-list__delete-icon" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-link co-list-input__add-btn" onClick={() => this.addValue()}>
          <i className="fa fa-plus-circle pairs-list__add-icon" aria-hidden="true" />Add More
        </button>
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
};
