import React from 'react';
import { Link } from 'react-router';
import classnames from 'classnames';

import {toRequirements} from '../../module/k8s/selector';
import {toString} from '../../module/k8s/selector-requirement';

const Requirement = ({kind, requirement, withIcon}) => {
  const requirementAsString           = toString(requirement);
  const requirementAsUrlEncodedString = encodeURIComponent(requirementAsString);

  return (
    <div className="co-m-requirement">
      <Link className={`co-m-requirement__${kind}-link`} to={`search?kind=${kind}&q=${requirementAsUrlEncodedString}`}>
        { withIcon &&
          <span>
            <i className="fa fa-search"></i>&nbsp;
          </span>
        }
        <span>{requirementAsString}</span>
      </Link>
    </div>
  );
};

export const Selector = ({kind, expand, selector}) => {
  const requirements = toRequirements(selector || {});

  const reqs = _.map(requirements, (requirement, i) => {
    const className = classnames({'co-m-requirement--last': i === requirements.length - 1});
    return <Requirement key={i} className={className} kind={kind || 'pod'} requirement={requirement} withIcon={i === 0} />;
  });

  const className = classnames('co-m-selector', {'co-m-selector--expand': expand});

  return <div className={className}>
    { reqs.length ? reqs : <p className="text-muted">No selector</p> }
  </div>;
};
