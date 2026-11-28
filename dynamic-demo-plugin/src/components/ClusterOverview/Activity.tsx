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
import { useTranslation } from 'react-i18next';

// Function declarations so the module factory can initialize the exports
// before the shared module requires complete, regardless of evaluation order.
export function DemoActivity({ resource }: K8sActivityProps) {
  return (
    <React.Fragment>
      <Progress
        size={ProgressSize.sm}
        value={30}
        title={`Demo activity for node ${resource.metadata?.name}`}
      />
      <ResourceLink
        kind="Node"
        name={resource.metadata?.name}
        namespace={resource.metadata?.namespace}
      />
    </React.Fragment>
  );
}

export function DemoPrometheusActivity(_props: PrometheusActivityProps) {
  const { t } = useTranslation('plugin__console-demo-plugin');
  return (
    <div>
      <InProgressIcon /> {t('Demo prometheus activity')}
    </div>
  );
}

export function isActivity(resource: K8sResourceCommon) {
  return get(resource, ['metadata', 'labels', 'node-role.kubernetes.io/master']) === '';
}

export function isAlwaysActivity() {
  return true;
}

export function getTimestamp(resource: K8sResourceCommon) {
  return new Date(resource.metadata?.creationTimestamp || '');
}
