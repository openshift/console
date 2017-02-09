import React from 'react';
import { Link } from 'react-router';

import {kindObj, ResourceIcon} from './index';

export const resourcePath = (kind, name, namespace = undefined) => {
  const {path} = kindObj(kind);
  return path && `/${namespace ? `ns/${namespace}/` : ''}${path}/${name}`;
};

export const ResourceLink = ({kind, name, namespace, title}) => {
  const path = resourcePath(kind, name, namespace);
  return (
    <span className="co-resource-link">
      <ResourceIcon kind={kind} />
      {path ? <Link to={`${path}/details`} title={title}>{name}</Link> : <span>{name}</span>}
    </span>
  );
};
