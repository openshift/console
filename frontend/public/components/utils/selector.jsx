import * as _ from 'lodash-es';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { selectorToString } from '../../module/k8s/selector';

const Requirement = ({kind, requirements, namespace=''}) => {
  // Strip off any trailing '=' characters for valueless selectors
  const requirementAsString = selectorToString(requirements).replace(/=,/g, ',').replace(/=$/g, '');
  const requirementAsUrlEncodedString = encodeURIComponent(requirementAsString);

  let to;
  if (namespace) {
    to = `/search/ns/${namespace}?kind=${kind}&q=${requirementAsUrlEncodedString}`;
  } else {
    to = `/search/all-namespaces?kind=${kind}&q=${requirementAsUrlEncodedString}`;
  }

  return (
    <div className="co-m-requirement">
      <Link className={`co-m-requirement__link co-text-${kind.toLowerCase()}`} to={to} tabIndex={-1}>
        <i className="co-m-requirement__icon fa fa-search" aria-hidden="true"></i>
        <span className="co-m-requirement__label">{requirementAsString.replace(/,/g, ', ')}</span>
      </Link>
    </div>
  );
};

export const Selector = ({kind = 'Pod', selector = {}, namespace = undefined}) => <div className="co-m-selector">
  { _.isEmpty(selector)
    ? <p className="text-muted">No selector</p>
    : <Requirement kind={kind} requirements={selector} namespace={namespace} /> }
</div>;
