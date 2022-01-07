import * as React from 'react';
import * as _ from 'lodash-es';
import { K8sResourceKindReference } from '../../module/k8s';
import { ResourceIcon } from '@console/dynamic-plugin-sdk';

export { ResourceIcon, ResourceIconProps } from '@console/dynamic-plugin-sdk';

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
