import React from 'react';

import {kindObj, ResourceIcon} from './index';

export const resourcePath = (kind, name, namespace = undefined) => {
  const {path} = kindObj(kind);
  return path && `${namespace ? `ns/${namespace}/` : ''}${path}/${name}`;
};

export const ResourceLink = ({kind, name, namespace, title}) => {
  const path = resourcePath(kind, name, namespace);
  return (
    <span className="co-resource-link">
      <ResourceIcon kind={kind} />
      {path ? <a href={`${path}/details`} title={title}>{name}</a> : <span>{name}</span>}
    </span>
  );
};
