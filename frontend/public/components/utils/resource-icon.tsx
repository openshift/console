import type { FC } from 'react';
import { css } from '@patternfly/react-styles';
import * as _ from 'lodash';
import type { ResourceIconProps } from '@console/dynamic-plugin-sdk';
import { getReference } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { DefaultNamespaceLabel } from '@console/shared/src/components/namespace/DefaultNamespaceWarning';
import type { K8sResourceKindReference } from '../../module/k8s';
import { kindToAbbr } from '../../module/k8s/get-resources';
import { modelFor } from '../../module/k8s/k8s-models';

const renderResourceIcon = (kindReference: string, className?: string) => {
  const kindObj = modelFor(kindReference);
  const kindStr = kindObj?.kind ?? kindReference;
  const backgroundColor = _.get(kindObj, 'color', undefined);
  const klass = css(`co-m-resource-icon co-m-resource-${kindStr.toLowerCase()}`, className);
  const iconLabel = (kindObj && kindObj.abbr) || kindToAbbr(kindStr);

  return (
    <>
      <span className="pf-v6-u-screen-reader">{kindStr}</span>
      <span className={klass} title={kindStr} style={{ backgroundColor }}>
        {iconLabel}
      </span>
    </>
  );
};

const memoizedResourceIcon = _.memoize(
  renderResourceIcon,
  (kindReference: string, className?: string) =>
    className ? `${kindReference}/${className}` : kindReference,
);

export const ResourceIcon: FC<ResourceIconProps> = ({ className, groupVersionKind, kind }) => {
  // if no kind or groupVersionKind, return null so an empty icon isn't rendered
  if (!kind && !groupVersionKind) {
    return null;
  }
  const kindReference = kind || getReference(groupVersionKind);
  // Only the rendering of known kinds is cached — a model for an unknown
  // kind may still load, which changes how the icon renders.
  const kindObj = modelFor(kindReference);

  return kindObj
    ? memoizedResourceIcon(kindReference, className)
    : renderResourceIcon(kindReference, className);
};

export type ResourceNameProps = {
  kind: K8sResourceKindReference;
  showDefaultWarning?: boolean;
  name: string;
};

export const ResourceName: FC<ResourceNameProps> = (props) => (
  <span className="co-resource-item">
    <ResourceIcon kind={props.kind} />{' '}
    <span className="co-resource-item__resource-name" data-test={`resource-name-${props.name}`}>
      {props.name}
    </span>
    {props.showDefaultWarning && (props.kind === 'Namespace' || props.kind === 'Project') ? (
      <DefaultNamespaceLabel namespace={props.name} isProject={props.kind === 'Project'} />
    ) : null}
  </span>
);

ResourceName.displayName = 'ResourceName';
