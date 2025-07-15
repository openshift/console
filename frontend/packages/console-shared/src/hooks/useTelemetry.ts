import { useEffect, useCallback } from 'react';
import {
  useResolvedExtensions,
  isTelemetryListener,
  TelemetryListener,
  TelemetryEventListener,
  UserInfo,
} from '@console/dynamic-plugin-sdk';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { UserModel } from '@console/internal/models';
import type { UserKind } from '@console/internal/module/k8s/types';
import {
  CLUSTER_TELEMETRY_ANALYTICS,
  PREFERRED_TELEMETRY_USER_SETTING_KEY,
  USER_TELEMETRY_ANALYTICS,
} from '../constants';
import { useUserSettings } from './useUserSettings';

export interface ClusterProperties {
  clusterId?: string;
  clusterType?: string;
  consoleVersion?: string;
  organizationId?: string;
  accountMail?: string;
}

export type TelemetryEventProperties = {
  user?: UserInfo;
  userResource?: UserKind;
} & ClusterProperties &
  Record<string, any>;

export interface TelemetryEvent {
  eventType: string;
  event: TelemetryEventProperties;
}

let telemetryEvents: TelemetryEvent[] = [];

export const getClusterProperties = () => {
  const clusterProperties: ClusterProperties = {};
  clusterProperties.clusterId = window.SERVER_FLAGS.telemetry?.CLUSTER_ID;
  clusterProperties.clusterType = window.SERVER_FLAGS.telemetry?.CLUSTER_TYPE;
  if (
    window.SERVER_FLAGS.telemetry?.CLUSTER_TYPE === 'OSD' &&
    window.SERVER_FLAGS.telemetry?.DEVSANDBOX === 'true'
  ) {
    clusterProperties.clusterType = 'DEVSANDBOX';
  }
  // Prefer to report the OCP version (releaseVersion) if available.
  clusterProperties.consoleVersion =
    window.SERVER_FLAGS.releaseVersion || window.SERVER_FLAGS.consoleVersion;
  clusterProperties.organizationId = window.SERVER_FLAGS.telemetry?.ORGANIZATION_ID;
  clusterProperties.accountMail = window.SERVER_FLAGS.telemetry?.ACCOUNT_MAIL;
  return clusterProperties;
};

const clusterIsOptedInToTelemetry = () =>
  window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.OPTIN;

const isOptedOutFromTelemetry = (currentUserPreferenceTelemetryValue: USER_TELEMETRY_ANALYTICS) =>
  window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.DISABLED ||
  (currentUserPreferenceTelemetryValue === USER_TELEMETRY_ANALYTICS.DENY &&
    (clusterIsOptedInToTelemetry() ||
      window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.OPTOUT));

const userIsOptedInToTelemetry = (currentUserPreferenceTelemetryValue: USER_TELEMETRY_ANALYTICS) =>
  currentUserPreferenceTelemetryValue === USER_TELEMETRY_ANALYTICS.ALLOW;

let clusterProperties = getClusterProperties();

export const updateClusterPropertiesFromTests = () => (clusterProperties = getClusterProperties());

export const useTelemetry = () => {
  // TODO use useDynamicPluginInfo() hook to tell whether all dynamic plugins have been processed
  // to avoid firing telemetry events multiple times whenever a dynamic plugin loads asynchronously

  const [currentUserPreferenceTelemetryValue] = useUserSettings<USER_TELEMETRY_ANALYTICS>(
    PREFERRED_TELEMETRY_USER_SETTING_KEY,
    null,
    true,
  );

  const [userResource, userResourceIsLoaded] = useK8sGet<UserKind>(UserModel, '~');

  const [extensions] = useResolvedExtensions<TelemetryListener>(isTelemetryListener);

  useEffect(() => {
    if (
      userIsOptedInToTelemetry(currentUserPreferenceTelemetryValue) &&
      clusterIsOptedInToTelemetry() &&
      telemetryEvents.length > 0 &&
      userResourceIsLoaded
    ) {
      telemetryEvents.forEach(({ eventType, event }) => {
        extensions.forEach((e) => e.properties.listener(eventType, { ...event, userResource }));
      });
      telemetryEvents = [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserPreferenceTelemetryValue, userResourceIsLoaded]);

  return useCallback<TelemetryEventListener>(
    (eventType, properties: Record<string, any>) => {
      if (isOptedOutFromTelemetry(currentUserPreferenceTelemetryValue)) return;

      const event = {
        ...clusterProperties,
        ...properties,
        // This is required to ensure that the replayed events uses the right path.
        path: properties?.pathname,
      };

      if (
        (clusterIsOptedInToTelemetry() && !currentUserPreferenceTelemetryValue) ||
        !userResourceIsLoaded
      ) {
        telemetryEvents.push({ eventType, event });

        if (telemetryEvents.length > 10) {
          telemetryEvents.shift(); // Remove the first element
        }

        return;
      }

      extensions.forEach((e) => e.properties.listener(eventType, { ...event, userResource }));
    },
    [extensions, currentUserPreferenceTelemetryValue, userResource, userResourceIsLoaded],
  );
};
