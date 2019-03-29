/* eslint-disable no-undef, no-unused-vars */
import * as React from 'react';

import { Dropdown } from '../utils';

export const MappingMethod: React.FC<MappingMethodProps> = ({value, onChange}) => {
  const mappingMethodChanged = (mappingMethod: MappingMethodType) => {
    onChange(mappingMethod);
  };
  const mappingMethods = {
    'claim': 'Claim',
    'lookup': 'Lookup',
    'add': 'Add',
  };
  return (
    <div className="form-group">
      <label className="control-label co-required" htmlFor="tag">Mapping Method</label>
      <Dropdown dropDownClassName="dropdown--full-width" items={mappingMethods} selectedKey={value} title={mappingMethods[value]} onChange={mappingMethodChanged} />
      <div className="help-block" id="mapping-method-description">
        { /* TODO: Add doc link when available in 4.0 docs. */ }
        Specifies how new identities are mapped to users when they log in.
      </div>
    </div>
  );
};

export type MappingMethodType = 'claim' | 'lookup' | 'add';

type MappingMethodProps = {
  value: MappingMethodType;
  onChange: (value: MappingMethodType) => void;
};
