import * as _ from 'lodash-es';
import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';

import { ResourceIcon } from './index';
import { modelFor, referenceForModel } from '../../module/k8s';
import { connectToModel } from '../../kinds';
import { connectToFlags, FLAGS } from '../../features';

const unknownKinds = new Set();

export const resourcePathFromModel = (model, name, namespace) => {
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

export const resourceListPathFromModel = (model, namespace) => resourcePathFromModel(model, null, namespace);

/**
 * NOTE: This will not work for runtime-defined resources. Use a `connect`-ed component like `ResourceLink` instead.
 */
export const resourcePath = (kind, name, namespace) => {
  const model = modelFor(kind);
  if (!model) {
    if (!unknownKinds.has(kind)) {
      unknownKinds.add(kind);
      // eslint-disable-next-line no-console
      console.error(`resourcePath: no model for "${kind}"`);
    }
    return;
  }

  return resourcePathFromModel(model, name, namespace);
};

export const resourceObjPath = (obj, kind) => resourcePath(kind, _.get(obj, 'metadata.name'), _.get(obj, 'metadata.namespace'));

export const ResourceLink = connectToModel(
  ({className, kind, name, namespace, title, displayName, linkTo = true, kindsInFlight}) => {
    if (kindsInFlight) {
      return null;
    }
    const path = resourcePath(kind, name, namespace);
    const value = displayName ? displayName : name;

    return <span className={classNames('co-resource-link', className)}>
      <ResourceIcon kind={kind} />
      {(path && linkTo) ? <Link to={path} title={title} className="co-resource-link__resource-name">{value}</Link> : <span className="co-resource-link__resource-name">{value}</span>}
    </span>;
  });

ResourceLink.displayName = 'ResourceLink';

const NodeLink_ = (props) => {
  const {name, flags} = props;
  if (!name) {
    return <React.Fragment>-</React.Fragment>;
  }
  return flags[FLAGS.CAN_LIST_NODE]
    ? <ResourceLink kind="Node" name={name} title={name} />
    : <React.Fragment>{name}</React.Fragment>;
};

export const NodeLink = connectToFlags(FLAGS.CAN_LIST_NODE)(NodeLink_);
