import * as React from 'react';
import { Dropdown } from '../../utils/dropdown';
import * as classNames from 'classnames';
import { useFormContext, Controller } from 'react-hook-form';

export const InputSelectBox: React.FC<InputSelectProps> = props => {
  const { register, control } = useFormContext();
  const { items, textName, dropdownName, selectedKey, placeholder, required, minValue, inputClassName, id } = props;
  return (
    <div className="pf-c-input-group">
      <input className={classNames('pf-c-form-control', inputClassName)} ref={register} id={id} type="number" placeholder={placeholder} name={textName} required={required} min={minValue} />
      <Controller as={Dropdown} control={control} selectedKey={selectedKey} name={dropdownName} className="btn-group" items={items} required={required} />
    </div>
  );
};

export type InputSelectProps = {
  items: {};
  textName: string;
  dropdownName: string;
  id?: string;
  selectedKey?: string;
  placeholder?: string;
  required?: boolean;
  minValue?: number;
  inputClassName?: string;
};
