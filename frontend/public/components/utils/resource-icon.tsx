import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';

import { K8sResourceKindReference } from '../../module/k8s';
import { modelFor } from '../../module/k8s/k8s-models';
import { kindToAbbr } from '../../module/k8s/get-resources';

const MEMO = {};

export const ResourceIcon = (props: ResourceIconProps) => {
  const { kind, className } = props;
  const memoKey = className ? `${kind}/${className}` : kind;
  if (MEMO[memoKey]) {
    return MEMO[memoKey];
  }
  const kindObj = modelFor(kind);
  const kindStr = _.get(kindObj, 'kind', kind);
  const klass = classNames(`co-m-resource-icon co-m-resource-${kindStr.toLowerCase()}`, className);
  const iconLabel = (kindObj && kindObj.abbr) || kindToAbbr(kindStr);

  const rendered = <React.Fragment>
    <span className="sr-only">{kindStr}</span>
    <span className={klass} title={kindStr}>{iconLabel}</span>
  </React.Fragment>;
  if (kindObj) {
    MEMO[memoKey] = rendered;
  }

  return rendered;
};

/* eslint-disable no-undef */
export type ResourceIconProps = {
  className?: string;
  kind: K8sResourceKindReference;
};

export type ResourceNameProps = {
  kind: K8sResourceKindReference;
  name: string;
};
/* eslint-enable no-undef */

export const ResourceName: React.SFC<ResourceNameProps> = (props) => <span className="co-resource-link"><ResourceIcon kind={props.kind} /> <span className="co-resource-link__resource-name">{props.name}</span></span>;

ResourceName.displayName = 'ResourceName';
