import * as React from 'react';
import { get } from 'lodash';
import {
  PrometheusActivityProps,
  K8sActivityProps,
  ResourceLink,
  K8sResourceCommon,
} from '@openshift-console/dynamic-plugin-sdk';
import { Progress, ProgressSize } from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons';

export const DemoActivity: React.FC<K8sActivityProps> = ({ resource }) => (
  <>
    <Progress size={ProgressSize.sm} value={30} title={`Demo activity for node ${resource.metadata?.name}`} />
    <ResourceLink
      kind="Node"
      name={resource.metadata?.name}
      namespace={resource.metadata?.namespace}
    />
  </>
);

export const DemoPrometheusActivity: React.FC<PrometheusActivityProps> = () => (
  <div>
    <InProgressIcon />
    Demo prometheus activity
  </div>
);

export const isActivity = (resource: K8sResourceCommon) =>
  get(resource, ['metadata', 'labels', 'node-role.kubernetes.io/master']) === '';

export const isAlwaysActivity = () => true;

export const getTimestamp = (resource: K8sResourceCommon) =>
  new Date(resource.metadata?.creationTimestamp || '');
