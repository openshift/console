import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash';

import { getReference, kindToAbbr } from '../../../utils/k8s';
import { K8sGroupVersionKind, K8sResourceKindReference } from '../../../extensions/console-types';
import { modelFor } from '../../module/k8s/k8s-models'; // ??! - TO DO -resolve this dependency

export type ResourceIconProps = {
  className?: string;
  /** @deprecated Use groupVersionKind instead. The kind property will be removed in a future release. */
  kind?: K8sResourceKindReference;
  groupVersionKind?: K8sGroupVersionKind;
};

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
  const klass = classNames(`co-m-resource-icon co-m-resource-${kindStr.toLowerCase()}`, className);
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

export default ResourceIcon;
