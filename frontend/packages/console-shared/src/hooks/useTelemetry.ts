import { useEffect, useCallback } from 'react';
import type {
  TelemetryListener,
  TelemetryEventListener,
  UserInfo,
} from '@console/dynamic-plugin-sdk';
import { useResolvedExtensions, isTelemetryListener } from '@console/dynamic-plugin-sdk';
import type { UserKind } from '@console/internal/module/k8s/types';
import {
  CLUSTER_TELEMETRY_ANALYTICS,
  PREFERRED_TELEMETRY_USER_PREFERENCE_KEY,
  USER_TELEMETRY_ANALYTICS,
} from '../constants';
import { useUser } from './useUser';
import { useUserPreference } from './useUserPreference';

export interface ClusterProperties {
  clusterId?: string;
  clusterType?: string;
  consoleVersion?: string;
  organizationId?: string;
  accountMailDomain?: string;
}

export type TelemetryEventProperties = {
  user?: UserInfo;
  /** Only sent if in a sandbox cluster */
  sandboxUserId?: string;
} & ClusterProperties &
  Record<string, any>;

export interface TelemetryEvent {
  eventType: string;
  event: TelemetryEventProperties;
}

let telemetryEvents: TelemetryEvent[] = [];

const getEmailDomain = (email: string = ''): string => {
  const emailParts = email.split('@');
  return emailParts.length === 2 ? emailParts[1] : '';
};

export const getClusterProperties = () => {
  const clusterProperties: ClusterProperties = {};
  clusterProperties.clusterId = window.SERVER_FLAGS.telemetry?.CLUSTER_ID;
  clusterProperties.clusterType = window.SERVER_FLAGS.telemetry?.CLUSTER_TYPE;
  if (window.SERVER_FLAGS.telemetry?.DEVSANDBOX === 'true') {
    clusterProperties.clusterType = 'DEVSANDBOX';
  }
  // Prefer to report the OCP version (releaseVersion) if available.
  clusterProperties.consoleVersion =
    window.SERVER_FLAGS.releaseVersion || window.SERVER_FLAGS.consoleVersion;
  clusterProperties.organizationId = window.SERVER_FLAGS.telemetry?.ORGANIZATION_ID;
  clusterProperties.accountMailDomain = getEmailDomain(window.SERVER_FLAGS.telemetry?.ACCOUNT_MAIL);
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

const injectSandboxProperties = (
  properties: TelemetryEventProperties,
  userResource: UserKind,
): TelemetryEventProperties => {
  if (clusterProperties.clusterType === 'DEVSANDBOX') {
    return {
      ...properties,
      sandboxUserId:
        userResource?.metadata?.annotations?.['toolchain.dev.openshift.com/sso-user-id'],
    };
  }
  return properties;
};

export const useTelemetry = () => {
  // TODO use usePluginInfo() hook to tell whether all dynamic plugins have been processed
  // to avoid firing telemetry events multiple times whenever a dynamic plugin loads asynchronously

  const [currentUserPreferenceTelemetryValue] = useUserPreference<USER_TELEMETRY_ANALYTICS>(
    PREFERRED_TELEMETRY_USER_PREFERENCE_KEY,
    null,
    true,
  );

  // Use centralized user data instead of fetching directly
  const { userResource, userResourceLoaded: userResourceIsLoaded } = useUser();

  const [extensions] = useResolvedExtensions<TelemetryListener>(isTelemetryListener);

  useEffect(() => {
    if (
      userIsOptedInToTelemetry(currentUserPreferenceTelemetryValue) &&
      clusterIsOptedInToTelemetry() &&
      telemetryEvents.length > 0 &&
      userResourceIsLoaded
    ) {
      telemetryEvents.forEach(({ eventType, event }) => {
        // Sends the telemetry event to all the listeners
        extensions.forEach((e) =>
          e.properties.listener(eventType, injectSandboxProperties(event, userResource)),
        );
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

      // Sends the telemetry event to all the listeners
      extensions.forEach((e) =>
        e.properties.listener(eventType, injectSandboxProperties(event, userResource)),
      );
    },
    [extensions, currentUserPreferenceTelemetryValue, userResource, userResourceIsLoaded],
  );
};
