import * as _ from 'lodash-es';
import * as React from 'react';

const node = (className, children, description) => (
  <div className={className}>
    <div>{children}</div>
    <p className="help-block">{description}</p>
  </div>
);

const makeNode = (id, label, description, children, isRequired) => {
  // children node 개수에 따라 가로 분할 class 적용
  let isArray = Array.isArray(children);
  let className = isArray ? `col-md-${12 / children.length}` : 'col-md-12';
  return isArray ? children.map(cur => node(className, cur, description)) : node(className, children, description);
};

export const Section: React.FC<SectionProps> = ({ id, label, description, children, isRequired = false }) => {
  let result = makeNode(id, label, description, children, isRequired);
  return (
    <div className="form-group">
      <label className={'control-label ' + (isRequired ? 'co-required' : '')} htmlFor={id}>
        {label}
      </label>
      <div className="row">{result}</div>
    </div>
  );
};

type SectionProps = {
  id: string;
  children: Array<React.ReactNode> | React.ReactNode;
  label?: string;
  description?: string;
  isRequired?: boolean;
};
