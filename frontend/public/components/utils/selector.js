import React from 'react';
import classNames from 'classnames';

import {angulars} from '../react-wrapper';

const Requirement = ({requirement, withIcon}) => {
  const requirementAsString           = angulars.k8s.selectorRequirement.toString(requirement);
  const requirementAsUrlEncodedString = encodeURIComponent(requirementAsString);

  return (
    <div className="co-m-requirement">
      <a className="co-m-requirement__link" href={"/search?kind=pod&amp;q=" + requirementAsUrlEncodedString}>
        { withIcon &&
          <span>
            <i className="fa fa-search"></i>&nbsp;
          </span>
        }
        <span>{requirementAsString}</span>
      </a>
    </div>
  );
};

export default ({expand, selector}) => {
  const requirements = angulars.k8s.selector.toRequirements(selector || {});

  const reqs = _.map(requirements, (requirement, i) => {
    const className = classNames({'co-m-requirement--last': i === requirements.length - 1});
    return <Requirement key={i} className={className} requirement={requirement} withIcon={i === 0} />
  });

  const className = classNames("co-m-selector", {'co-m-selector--expand': expand});

  return <div className={className}>
    { reqs.length ? reqs : <p className="text-muted">No selector</p> }
  </div>
};
