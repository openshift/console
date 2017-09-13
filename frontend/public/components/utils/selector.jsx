import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from'classnames';

import { selectorToString } from '../../module/k8s/selector';

const Requirement = ({kind, requirements, namespace=''}) => {
  // Strip off any trailing '=' characters for valueless selectors
  const requirementAsString = selectorToString(requirements).replace(/=,/g, ',').replace(/=$/g, '');
  const requirementAsUrlEncodedString = encodeURIComponent(requirementAsString);

  let to = `/search?kind=${kind}&q=${requirementAsUrlEncodedString}`;
  if (namespace) {
    to = `/ns/${namespace}/${to}`;
  }

  return (
    <div className="co-m-requirement">
      <Link className={`co-text-${kind.toLowerCase()}`} to={to}>
        <i className="fa fa-search"></i> {requirementAsString.replace(/,/g, ', ')}
      </Link>
    </div>
  );
};

export const Selector = ({kind, expand, selector, namespace, style}) => {
  const requirements = selector || {};
  const className = classNames('co-m-selector', {'co-m-selector--expand': expand});

  return <div className={className} style={style}>
    { _.isEmpty(requirements)
      ? <p className="text-muted">No selector</p>
      : <Requirement kind={kind || 'Pod'} requirements={requirements} namespace={namespace} /> }
  </div>;
};
