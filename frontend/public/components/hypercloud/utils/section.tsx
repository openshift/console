import * as _ from 'lodash-es';
import * as React from 'react';

export const Section: React.FC<SectionProps> = ({ id, label, description, children, isRequired=false }) => (
  <div className="form-group">
    <label className={"control-label "+ (isRequired ? "co-required" : "")} htmlFor={id}>
      {label}
    </label>
    <div>{children}</div>
    <p className="help-block">{description}</p>
  </div>
);

type SectionProps = {
  id: string;
  label?: string;
  description?: string;
  isRequired?: boolean
  children?: React.ReactNode
}
