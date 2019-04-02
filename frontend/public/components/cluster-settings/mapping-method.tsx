/* eslint-disable no-undef, no-unused-vars */
import * as React from 'react';
import { FieldLevelHelp } from 'patternfly-react';

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
      <label className="control-label" htmlFor="tag">
        Mapping Method
        <FieldLevelHelp content={
          <ul>
            <li>
              <strong>Claim</strong> maps users using the provider&apos;s preferred
              username. Fails if a user with that name already exists for a
              different identity provider.
            </li>
            <li>
              <strong>Lookup</strong> requires administrators to manually
              provision identities and users.
            </li>
            <li>
              <strong>Add</strong> works like claim, but reuses existing users.
              It should only be selected when you have multiple identity stores
              that map to the same logical set of users.
            </li>
          </ul>
        } />
      </label>
      <Dropdown dropDownClassName="dropdown--full-width" items={mappingMethods} selectedKey={value} title={mappingMethods[value]} onChange={mappingMethodChanged} />
      <div className="help-block" id="mapping-method-description">
        { /* TODO: Add doc link when available in 4.0 docs. */ }
        Specifies how new identities are mapped to users when they log in. Claim is recommended in most cases.
      </div>
    </div>
  );
};

export type MappingMethodType = 'claim' | 'lookup' | 'add';

type MappingMethodProps = {
  value: MappingMethodType;
  onChange: (value: MappingMethodType) => void;
};
