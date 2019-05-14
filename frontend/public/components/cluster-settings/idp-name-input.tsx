import * as React from 'react';

export const IDPNameInput: React.FC<IDPNameInputProps> = ({value, onChange}) => (
  <div className="form-group">
    <label className="control-label co-required" htmlFor="idp-name">Name</label>
    <input className="form-control"
      type="text"
      onChange={onChange}
      value={value}
      aria-describedby="idp-name-help"
      id="idp-name"
      required />
    <p className="help-block" id="idp-name-help">
      Unique name of the new identity provider. This cannot be changed later.
    </p>
  </div>
);

type IDPNameInputProps = {
  value: string;
  onChange: React.ReactEventHandler<HTMLInputElement>;
};
