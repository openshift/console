import * as React from 'react';
import { StackItem, Stack } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { HealthState } from '@console/dynamic-plugin-sdk';
import {
  PrometheusHealthPopupProps,
  PrometheusHealthHandler,
} from '@console/dynamic-plugin-sdk/dist/core/lib/lib-core';
import { ConfigMap } from '../../resources';
import { getVSphereHealth } from '../getVSphereHealth';
import { VSphereConnection } from '../VSphereConnection';
import { VSphereOperatorStatuses } from '../VSphereOperatorStatuses';
import './VSphereStatus.css';

// https://issues.redhat.com/browse/MGMT-9085
// https://access.redhat.com/solutions/6677901

const VSphereStatus: React.FC<PrometheusHealthPopupProps> = ({ hide, responses, k8sResult }) => {
  const { t } = useTranslation();
  const health = getVSphereHealth(t, responses, k8sResult);

  if (
    [HealthState.OK, HealthState.WARNING, HealthState.PROGRESS].includes(health.state) &&
    k8sResult?.data
  ) {
    const cloudProviderConfig = k8sResult.data as ConfigMap;
    return (
      <VSphereConnection hide={hide} cloudProviderConfig={cloudProviderConfig} health={health} />
    );
  }

  if (health.state === HealthState.LOADING) {
    return (
      <Stack hasGutter>
        <StackItem>{t('vsphere-plugin~Loading vSphere connection status')}</StackItem>
      </Stack>
    );
  }

  return (
    <div>
      <Stack hasGutter>
        <StackItem>{t('vsphere-plugin~The vSphere Connection check is failing.')}</StackItem>
        <StackItem>
          <VSphereOperatorStatuses />
        </StackItem>
      </Stack>
    </div>
  );
};

export const healthHandler: PrometheusHealthHandler = (responses, t, additionalResource) => {
  const health = getVSphereHealth(t, responses, additionalResource);
  const { state } = health;

  let message: string | undefined;
  switch (state) {
    case HealthState.WARNING:
      message = health.message;
      break;
    case HealthState.PROGRESS:
      message = t('vsphere-plugin~Learn more about progress');
      break;
    default:
      break;
  }
  return { state, message };
};

export default VSphereStatus;
