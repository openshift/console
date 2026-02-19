import { useEffect, useCallback, useRef } from 'react';
import {
  useResolvedExtensions,
  isTelemetryListener,
  TelemetryListener,
  TelemetryEventListener,
  UserInfo,
} from '@console/dynamic-plugin-sdk';
import type { UserKind } from '@console/internal/module/k8s/types';
import {
  CLUSTER_TELEMETRY_ANALYTICS,
  PREFERRED_TELEMETRY_USER_SETTING_KEY,
  USER_TELEMETRY_ANALYTICS,
} from '../constants';
import { useUser } from './useUser';
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

export const clearTelemetryEventsForTests = () => {
  telemetryEvents = [];
};

export const useTelemetry = () => {
  // TODO use usePluginInfo() hook to tell whether all dynamic plugins have been processed
  // to avoid firing telemetry events multiple times whenever a dynamic plugin loads asynchronously

  const [currentUserPreferenceTelemetryValue] = useUserSettings<USER_TELEMETRY_ANALYTICS>(
    PREFERRED_TELEMETRY_USER_SETTING_KEY,
    null,
    true,
  );

  // Use centralized user data instead of fetching directly
  const { userResource, userResourceLoaded: userResourceIsLoaded } = useUser();

  const [extensions] = useResolvedExtensions<TelemetryListener>(isTelemetryListener);

  // Store current values in refs so the callback can access them without being recreated
  const extensionsRef = useRef(extensions);
  extensionsRef.current = extensions;
  const userPreferenceRef = useRef(currentUserPreferenceTelemetryValue);
  userPreferenceRef.current = currentUserPreferenceTelemetryValue;
  const userResourceRef = useRef(userResource);
  userResourceRef.current = userResource;
  const userResourceIsLoadedRef = useRef(userResourceIsLoaded);
  userResourceIsLoadedRef.current = userResourceIsLoaded;

  // Replay queued events when user explicitly opts in (OPT-IN cluster mode only)
  useEffect(() => {
    if (
      userIsOptedInToTelemetry(currentUserPreferenceTelemetryValue) &&
      clusterIsOptedInToTelemetry() &&
      extensions.length > 0 &&
      userResourceIsLoaded &&
      telemetryEvents.length > 0
    ) {
      telemetryEvents.forEach(({ eventType, event }) => {
        extensions.forEach((e) => e.properties.listener(eventType, { ...event, userResource }));
      });
      telemetryEvents = [];
    }
  }, [currentUserPreferenceTelemetryValue, userResourceIsLoaded, extensions, userResource]);

  // Return a stable callback that reads current values from refs
  // This prevents consumers from re-running effects when telemetry state changes
  return useCallback<TelemetryEventListener>(
    (eventType, properties: Record<string, any>) => {
      const currentUserPreference = userPreferenceRef.current;
      const currentExtensions = extensionsRef.current;
      const currentUserResource = userResourceRef.current;
      const currentUserResourceIsLoaded = userResourceIsLoadedRef.current;

      if (isOptedOutFromTelemetry(currentUserPreference)) {
        return;
      }

      const event = {
        ...clusterProperties,
        ...properties,
        // This is required to ensure that the replayed events uses the right path.
        path: properties?.pathname,
      };

      if (
        (clusterIsOptedInToTelemetry() && !currentUserPreference) ||
        !currentUserResourceIsLoaded
      ) {
        telemetryEvents.push({ eventType, event });

        if (telemetryEvents.length > 10) {
          telemetryEvents.shift();
        }

        return;
      }

      currentExtensions.forEach((e) =>
        e.properties.listener(eventType, { ...event, userResource: currentUserResource }),
      );
    },
    [], // Empty deps - callback is stable, reads current values from refs
  );
};
