import * as _ from 'lodash-es';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { ResourceIcon } from './index';
import { modelFor, referenceForModel } from '../../module/k8s';
import { connectToModel } from '../../kinds';

const unknownKinds = new Set();

/**
 * NOTE: This will not work for runtime-defined resources. Use a `connect`-ed component like `ResourceLink` instead.
 */
export const resourcePath = (kind, name, namespace = undefined) => {
  const model = modelFor(kind);
  if (!model) {
    if (!unknownKinds.has(kind)) {
      unknownKinds.add(kind);
      // eslint-disable-next-line no-console
      console.error(`resourcePath: no model for "${kind}"`);
    }
    return;
  }
  const {path, namespaced, crd} = model;

  let url = '/k8s/';

  if (!namespaced) {
    url += 'cluster/';
  }

  if (namespaced) {
    url += namespace ? `ns/${namespace}/` : 'all-namespaces/';
  }

  if (crd) {
    url += referenceForModel(model);
  } else if (path) {
    url += path;
  }

  if (name) {
    url += `/${name}`;
  }

  return url;
};

export const resourceObjPath = (obj, kind) => resourcePath(kind, _.get(obj, 'metadata.name'), _.get(obj, 'metadata.namespace'));

export const ResourceLink = connectToModel(
  ({kind, name, namespace, title, displayName, linkTo = true, kindsInFlight}) => {
    if (kindsInFlight) {
      return null;
    }
    const path = resourcePath(kind, name, namespace);
    const value = displayName ? displayName : name;

    return <span className="co-resource-link">
      <ResourceIcon kind={kind} />
      {(path && linkTo) ? <Link to={path} title={title}>{value}</Link> : <span>{value}</span>}
    </span>;
  });

ResourceLink.displayName = 'ResourceLink';
