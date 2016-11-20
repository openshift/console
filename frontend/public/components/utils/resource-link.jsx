import React from 'react';

import {angulars} from '../react-wrapper';
import {ResourceIcon} from './resource-icon';


export const ResourceLink = ({name, uid, kind, namespace}) => {
  const kindObj = _.find(angulars.kinds, {id: kind});

  let href;
  if (kindObj) {
    href = `${kindObj.path}/${name}/details`;
    if (namespace) {
      href = `ns/${namespace}/${href}`;
    }
  }

  return (
    <span className="co-resource-link">
      {kindObj && <ResourceIcon kind={kindObj.id} />}
      {href ? <a href={href} title={uid}>{name}</a> : <span>{name}</span>}
    </span>
  );
};
