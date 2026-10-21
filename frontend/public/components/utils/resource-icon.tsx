import type { FC } from 'react';
import { css } from '@patternfly/react-styles';
import * as _ from 'lodash';

import { getReference } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { ResourceIconProps } from '@console/dynamic-plugin-sdk';
import { K8sResourceKindReference } from '../../module/k8s';
import { modelFor } from '../../module/k8s/k8s-models';
import { kindToAbbr } from '../../module/k8s/get-resources';

const MEMO = {};

export const ResourceIcon: FC<ResourceIconProps> = ({ className, groupVersionKind, kind }) => {
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
  const klass = css(`co-m-resource-icon co-m-resource-${kindStr.toLowerCase()}`, className);
  const iconLabel = (kindObj && kindObj.abbr) || kindToAbbr(kindStr);

  const rendered = (
    <>
      <span className="pf-v6-u-screen-reader">{kindStr}</span>
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

export type ResourceNameProps = {
  kind: K8sResourceKindReference;
  name: string;
};

export const ResourceName: FC<ResourceNameProps> = (props) => (
  <span className="co-resource-item">
    <ResourceIcon kind={props.kind} />{' '}
    <span className="co-resource-item__resource-name">{props.name}</span>
  </span>
);

ResourceName.displayName = 'ResourceName';
