import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import type { Extension, PluginStoreInterface } from '@openshift/dynamic-plugin-sdk';
import { PluginEventType, usePluginStore } from '@openshift/dynamic-plugin-sdk';
import type { Location } from 'react-router';
import { matchRoutes, useLocation } from 'react-router';
import type {
  RoutePage,
  StandaloneRoutePage,
} from '@console/dynamic-plugin-sdk/src/extensions/pages';
import {
  isRoutePage,
  isStandaloneRoutePage,
} from '@console/dynamic-plugin-sdk/src/extensions/pages';
import {
  isDynamicPluginLoadSettled,
  subscribeToDynamicPluginLoads,
} from '@console/dynamic-plugin-sdk/src/runtime/plugin-init';
import { dynamicPluginNames } from '@console/plugin-sdk/src/utils/allowed-plugins';
import { getExtensionRoutePath } from './usePluginRoutes';

const FLAG_SETTLING_TIMEOUT_MS = 3000;

const pluginStoreEvents = [
  PluginEventType.PluginInfoChanged,
  PluginEventType.ExtensionsChanged,
  PluginEventType.FeatureFlagsChanged,
];

/**
 * - `loading`: a plugin is still loading, so its routes are not known yet
 * - `waiting`: a route for the current location may still be added
 * - `settled`: no plugin route can match the current location
 */
type PluginRouteStatus = 'loading' | 'waiting' | 'settled';

const isRouteExtension = (e: Extension): e is RoutePage | StandaloneRoutePage =>
  isRoutePage(e) || isStandaloneRoutePage(e);

const matchesLocation = (
  { properties: { path, exact } }: RoutePage | StandaloneRoutePage,
  location: Location,
) =>
  matchRoutes(
    (Array.isArray(path) ? path : [path]).map((p) => ({ path: getExtensionRoutePath(p, exact) })),
    location,
  ) !== null;

/** Uses the same flag rules as `PluginStore.isExtensionInUse` for extensions not yet in use. */
const isWaitingForFlags = (e: Extension, flags: Record<string, boolean>) => {
  const required = e.flags?.required ?? [];
  const disallowed = e.flags?.disallowed ?? [];
  return (
    required.some((flag) => flags[flag] === undefined) &&
    !required.some((flag) => flags[flag] === false) &&
    !disallowed.some((flag) => flags[flag] === true)
  );
};

const getPluginRouteStatus = (
  pluginStore: PluginStoreInterface,
  location: Location,
): PluginRouteStatus => {
  const pluginInfo = pluginStore.getPluginInfo();

  if (pluginInfo.some((entry) => entry.status === 'pending')) {
    return 'loading';
  }

  const hasUnprocessedDynamicPlugins = dynamicPluginNames.some(
    (pluginName) =>
      !isDynamicPluginLoadSettled(pluginName) &&
      !pluginInfo.some((entry) => entry.manifest.name === pluginName),
  );
  if (hasUnprocessedDynamicPlugins) {
    return 'waiting';
  }

  const hasMatchingRouteInUse = pluginStore
    .getExtensions()
    .some((e) => isRouteExtension(e) && matchesLocation(e, location));
  if (hasMatchingRouteInUse) {
    return 'waiting';
  }

  const flags = pluginStore.getFeatureFlags();
  const hasMatchingRouteWaitingForFlags = pluginInfo.some(
    (entry) =>
      entry.status === 'loaded' &&
      entry.enabled &&
      (entry.manifest.extensions as Extension[]).some(
        (e) => isRouteExtension(e) && isWaitingForFlags(e, flags) && matchesLocation(e, location),
      ),
  );

  return hasMatchingRouteWaitingForFlags ? 'waiting' : 'settled';
};

/**
 * Checks whether the 404 page can be shown for the current location.
 *
 * Plugin routes are added asynchronously: dynamic plugins are added to the `PluginStore`
 * after their manifests are fetched, and routes gated by feature flags are added once those
 * flags are set (e.g. by `console.flag` extensions or Console's own flag detection). This hook
 * reads the same `PluginStore` data that drives the router and reports whether a plugin route
 * could still match the current location.
 *
 * Plugins that are still loading are always waited for. Waiting for plugin manifests or
 * feature flags is capped by a timeout so that a flag that is never set does not block the
 * 404 page indefinitely.
 *
 * @returns `true` when no plugin route can match the current location or the timeout has elapsed
 */
export const usePluginFlagsSettled = (): boolean => {
  const pluginStore = usePluginStore();
  const location = useLocation();

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const unsubscribePluginStore = pluginStore.subscribe(pluginStoreEvents, onStoreChange);
      const unsubscribePluginLoads = subscribeToDynamicPluginLoads(onStoreChange);
      return () => {
        unsubscribePluginStore();
        unsubscribePluginLoads();
      };
    },
    [pluginStore],
  );
  const status = useSyncExternalStore(subscribe, () => getPluginRouteStatus(pluginStore, location));

  const waitingFor = status === 'waiting' ? location.pathname : null;
  const [flagSettlingTimedOut, setFlagSettlingTimedOut] = useState(false);

  const [prevWaitingFor, setPrevWaitingFor] = useState<string | null>(waitingFor);
  if (prevWaitingFor !== waitingFor) {
    setPrevWaitingFor(waitingFor);
    setFlagSettlingTimedOut(false);
  }

  useEffect(() => {
    if (waitingFor === null || flagSettlingTimedOut) {
      return;
    }

    const timer = setTimeout(() => setFlagSettlingTimedOut(true), FLAG_SETTLING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [waitingFor, flagSettlingTimedOut]);

  return status === 'settled' || (status === 'waiting' && flagSettlingTimedOut);
};
