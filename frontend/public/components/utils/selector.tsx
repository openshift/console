import * as _ from 'lodash-es';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { Selector as SelectorKind } from '../../module/k8s';
import { selectorToString } from '../../module/k8s/selector';

const Requirement: React.FC<RequirementProps> = ({kind, requirements, namespace=''}) => {
  // Strip off any trailing '=' characters for valueless selectors
  const requirementAsString = selectorToString(requirements).replace(/=,/g, ',').replace(/=$/g, '');
  const requirementAsUrlEncodedString = encodeURIComponent(requirementAsString);

  const to = namespace
    ? `/search/ns/${namespace}?kind=${kind}&q=${requirementAsUrlEncodedString}`
    : `/search/all-namespaces?kind=${kind}&q=${requirementAsUrlEncodedString}`;

  return (
    <div className="co-m-requirement">
      <Link className={`co-m-requirement__link co-text-${kind.toLowerCase()}`} to={to} tabIndex={-1}>
        <i className="co-m-requirement__icon fa fa-search" aria-hidden="true"></i>
        <span className="co-m-requirement__label">{requirementAsString.replace(/,/g, ', ')}</span>
      </Link>
    </div>
  );
};
Requirement.displayName = 'Requirement';

export const Selector: React.FC<SelectorProps> = ({kind = 'Pod', selector = {}, namespace = undefined}) => <div className="co-m-selector">
  { _.isEmpty(selector)
    ? <p className="text-muted">No selector</p>
    : <Requirement kind={kind} requirements={selector} namespace={namespace} /> }
</div>;
Selector.displayName = 'Selector';

type RequirementProps = {
  kind: string;
  requirements: SelectorKind;
  namespace?: string;
};

type SelectorProps = {
  kind?: string;
  selector: SelectorKind;
  namespace?: string;
};
