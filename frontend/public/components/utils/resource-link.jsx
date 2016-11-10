import React from 'react';

import {angulars} from '../react-wrapper';
import {ResourceIcon} from './resource-icon';


export const ResourceLink = ({name, uid, kind, namespace}) => {
  let href, angularsKind;
  if (kind) {
    angularsKind = _.find(angulars.kinds, {id: kind.toLowerCase()});
    if (angularsKind) {
      href = `${angularsKind.path}/${name}/details`;
      if (namespace) {
        href = `ns/${namespace}/${href}`;
      }
    }
  }
  return (
    <span className="co-resource-link">
      {angularsKind && <ResourceIcon kind={angularsKind.id} />}
      {href ? <a href={href} title={uid}>{name}</a> : <span>{name}</span>}
    </span>
  );
};
