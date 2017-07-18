import React from 'react';
import { Link } from 'react-router';
import classnames from 'classnames';

import { toString } from '../../module/k8s/selector';

const Requirement = ({kind, requirements, namespace=''}) => {
  // Strip off any trailing '=' characters for valueless selectors
  const requirementAsString = toString(requirements).replace(/=,/g, ',').replace(/=$/g, '');
  const requirementAsUrlEncodedString = encodeURIComponent(requirementAsString);

  let to = `search?kind=${kind}&q=${requirementAsUrlEncodedString}`;
  if (namespace) {
    to = `ns/${namespace}/${to}`;
  }

  return (
    <div className="co-m-requirement">
      <Link className={`co-text-${kind}`} to={to}>
        <i className="fa fa-search"></i> {requirementAsString.replace(/,/g, ', ')}
      </Link>
    </div>
  );
};

export const Selector = ({kind, expand, selector, namespace}) => {
  const requirements = selector || {};
  const className = classnames('co-m-selector', {'co-m-selector--expand': expand});

  return <div className={className}>
    { _.isEmpty(requirements)
      ? <p className="text-muted">No selector</p>
      : <Requirement kind={kind || 'Pod'} requirements={requirements} namespace={namespace} /> }
  </div>;
};
