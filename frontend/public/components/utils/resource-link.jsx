import React from 'react';

import {angulars} from '../react-wrapper';
import {ResourceIcon} from './resource-icon';


export const ResourceLink = ({name, uid, kind, namespace}) => {
  let href;
  if (kind) {
    kind = _.find(angulars.kinds, {id: kind.toLowerCase()});
    href = `${kind.path}/${name}`;
    if (namespace) {
      href = `ns/${namespace}/${href}`;
    }
  }
  return (
    <span className="co-resource-link">
      {kind && <ResourceIcon kind={kind.id} />}
      {href ? <a href={href} title={uid}>{name}</a> : <span>{name}</span>}
    </span>
  );
};
