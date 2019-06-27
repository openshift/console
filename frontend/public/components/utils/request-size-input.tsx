import * as React from 'react';
import { Dropdown } from '.';

export class RequestSizeInput extends React.Component<RequestSizeInputProps> {
  state = {
    unit: this.props.defaultRequestSizeUnit,
    value: this.props.defaultRequestSizeValue,
  }

  onValueChange: React.ReactEventHandler<HTMLInputElement> = event => {
    this.setState({ value: event.currentTarget.value });
    this.props.onChange({ value: event.currentTarget.value, unit: this.state.unit });
  };

  onUnitChange = unit => {
    this.setState({ unit });
    this.props.onChange({ value: this.state.value, unit });
  }

  render() {
    const { describedBy, name } = this.props;
    const inputName = `${name}Value`;
    const dropdownName = `${name}Unit`;
    return (
      <div className="form-group">
        <div className="pf-c-input-group">
          <input
            className="pf-c-form-control"
            type="number"
            step="any"
            onChange={this.onValueChange}
            placeholder={this.props.placeholder}
            aria-describedby={describedBy}
            name={inputName}
            required={this.props.required}
          />
          <Dropdown
            title={this.props.defaultRequestSizeUnit}
            selectedKey={this.props.defaultRequestSizeUnit}
            name={dropdownName}
            className="btn-group"
            items={this.props.dropdownUnits}
            onChange={this.onUnitChange}
            required={this.props.required}
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
};
