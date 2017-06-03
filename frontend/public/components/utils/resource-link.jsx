import React from 'react';
import { Link } from 'react-router';

import {kindObj, ResourceIcon} from './index';

export const resourcePath = (kind, name, namespace = undefined) => {
  const {path} = kind === 'EtcdCluster' ? { path: 'etcdclusters' } : kindObj(kind);
  return path && `/${namespace ? `ns/${namespace}/` : ''}${path}/${name}`;
};

export const resourceObjPath = (obj, page = 'details') => {
  const path = resourcePath(obj.kind, _.get(obj, 'metadata.name'), _.get(obj, 'metadata.namespace'));
  return `${path}/${page}`;
};

export const ResourceLink = ({kind, name, namespace, title, displayName}) => {
  const path = resourcePath(kind, name, namespace);
  const value = displayName ? displayName : name;

  return (
    <span className="co-resource-link">
      <ResourceIcon kind={kind} />
      {path ? <Link to={`${path}/details`} title={title}>{value}</Link> : <span>{value}</span>}
    </span>
  );
};
