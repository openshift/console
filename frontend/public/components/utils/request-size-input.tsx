import * as React from 'react';
import { Dropdown } from './dropdown';
import * as classNames from 'classnames';

export class RequestSizeInput extends React.Component<RequestSizeInputProps> {
  state = {
    unit: this.props.defaultRequestSizeUnit,
    value: this.props.defaultRequestSizeValue,
  };

  onValueChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ value: event.currentTarget.value });
    this.props.onChange({ value: event.currentTarget.value, unit: this.state.unit });
  };

  onUnitChange = (unit) => {
    this.setState({ unit });
    this.props.onChange({ value: this.state.value, unit });
  };

  render() {
    const { describedBy, name, inputID } = this.props;
    const inputName = `${name}Value`;
    const dropdownName = `${name}Unit`;
    return (
      <div className="form-group">
        <div className="pf-c-input-group">
          <input
            className={classNames('pf-c-form-control', this.props.inputClassName)}
            type="number"
            step={this.props.step || 'any'}
            onChange={this.onValueChange}
            placeholder={this.props.placeholder}
            aria-describedby={describedBy}
            name={inputName}
            id={inputID}
            required={this.props.required}
            value={this.props.defaultRequestSizeValue}
            min={this.props.minValue}
          />
          <Dropdown
            title={this.props.dropdownUnits[this.props.defaultRequestSizeUnit]}
            selectedKey={this.props.defaultRequestSizeUnit}
            name={dropdownName}
            className="btn-group"
            items={this.props.dropdownUnits}
            onChange={this.onUnitChange}
            required={this.props.required}
            ariaLabel={`Number of ${this.props.dropdownUnits[this.props.defaultRequestSizeUnit]}`}
          />
        </div>
      </div>
    );
  }
}

export type RequestSizeInputProps = {
  placeholder?: string;
  name: string;
  onChange: Function;
  required?: boolean;
  dropdownUnits: any;
  defaultRequestSizeUnit: string;
  defaultRequestSizeValue: string;
  describedBy?: string;
  step?: number;
  minValue?: number;
  inputClassName?: string;
  inputID?: string;
};
