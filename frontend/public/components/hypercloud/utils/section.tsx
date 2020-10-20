import * as _ from 'lodash-es';
import * as React from 'react';

export const Section: React.FC<SectionProps> = ({ label, children, isRequired }) => (
  <div className={'form-group ' + (isRequired ? 'required' : '')}>
    <label className="control-label" htmlFor="secret-type">
      {label}
    </label>
    <div>{children}</div>
  </div>
);

type SectionProps = {
  label?: string;
  isRequired?: boolean
  children?: React.ReactNode
}