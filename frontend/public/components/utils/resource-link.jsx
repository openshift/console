import * as React from 'react';
import { Link } from 'react-router-dom';

import {kindObj, ResourceIcon} from './index';

export const resourcePath = (kind, name, namespace = undefined, prefix = undefined) => {
  const {path, namespaced} = kindObj(kind);

  let url = '/';

  if (prefix) {
    url += prefix;
  }

  if (namespaced) {
    url += `ns/${namespace ? namespace : 'all-namespaces'}/`;
  }

  if (path) {
    url += path;
  }
  if (name) {
    url += `/${name}`;
  }

  return url;
};

export const resourceObjPath = (obj, kind) => resourcePath(kind, _.get(obj, 'metadata.name'), _.get(obj, 'metadata.namespace'));

/** @type {React.StatelessComponent<{kind: K8sResourceKindReference, name: string, namespace: string, title: string, displayName?: string}>} */
export const ResourceLink = ({kind, name, namespace, title, displayName, prefix}) => {
  const path = resourcePath(kind, name, namespace, prefix);
  const value = displayName ? displayName : name;

  return (
    <span className="co-resource-link">
      <ResourceIcon kind={kind} />
      {path ? <Link to={`${path}`} title={title}>{value}</Link> : <span>{value}</span>}
    </span>
  );
};

ResourceLink.displayName = 'ResourceLink';
