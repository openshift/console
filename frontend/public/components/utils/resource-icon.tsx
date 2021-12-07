import * as React from 'react';
import classnames from 'classnames';
import * as _ from 'lodash-es';

import { getReference } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { K8sGroupVersionKind, K8sResourceKindReference } from '../../module/k8s';
import { modelFor } from '../../module/k8s/k8s-models';
import { kindToAbbr } from '../../module/k8s/get-resources';

const MEMO = {};

export const ResourceIcon: React.SFC<ResourceIconProps> = ({
  className,
  groupVersionKind,
  kind,
}) => {
  // if no kind or groupVersionKind, return null so an empty icon isn't rendered
  if (!kind && !groupVersionKind) {
    return null;
  }
  const kindReference = kind || getReference(groupVersionKind);
  const memoKey = className ? `${kindReference}/${className}` : kindReference;
  if (MEMO[memoKey]) {
    return MEMO[memoKey];
  }
  const kindObj = modelFor(kindReference);
  const kindStr = kindObj?.kind ?? kindReference;
  const backgroundColor = _.get(kindObj, 'color', undefined);
  const klass = classnames(`co-m-resource-icon co-m-resource-${kindStr.toLowerCase()}`, className);
  const iconLabel = (kindObj && kindObj.abbr) || kindToAbbr(kindStr);

  const rendered = (
    <>
      <span className="sr-only">{kindStr}</span>
      <span className={klass} title={kindStr} style={{ backgroundColor }}>
        {iconLabel}
      </span>
    </>
  );
  if (kindObj) {
    MEMO[memoKey] = rendered;
  }

  return rendered;
};

export type ResourceIconProps = {
  className?: string;
  /** @deprecated Use groupVersionKind instead. The kind property will be removed in a future release. */
  kind?: K8sResourceKindReference;
  groupVersionKind?: K8sGroupVersionKind;
};

export type ResourceNameProps = {
  kind: K8sResourceKindReference;
  name: string;
};

export const ResourceName: React.SFC<ResourceNameProps> = (props) => (
  <span className="co-resource-item">
    <ResourceIcon kind={props.kind} />{' '}
    <span className="co-resource-item__resource-name">{props.name}</span>
  </span>
);

ResourceName.displayName = 'ResourceName';
