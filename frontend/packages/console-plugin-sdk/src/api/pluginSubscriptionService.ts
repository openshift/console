import { PluginEventType } from '@openshift/dynamic-plugin-sdk';
import * as _ from 'lodash';
import { Store } from 'redux';
import type {
  Extension,
  ExtensionTypeGuard,
  LoadedExtension,
} from '@console/dynamic-plugin-sdk/src/types';
import type { RootState } from '@console/internal/redux';
import { PluginStore } from '../store';

let subscriptionServiceInitialized = false;

const extensionSubscriptions: ExtensionSubscription[] = [];

let onExtensionSubscriptionAdded: (sub: ExtensionSubscription) => void = _.noop;

const subscribe = <T>(sub: T, subList: T[], invokeListener: VoidFunction): VoidFunction => {
  let isSubscribed = true;

  subList.push(sub);
  invokeListener();

  return () => {
    if (isSubscribed) {
      isSubscribed = false;
      subList.splice(subList.indexOf(sub), 1);
    }
  };
};

export const initSubscriptionService = (pluginStore: PluginStore, reduxStore: Store<RootState>) => {
  if (subscriptionServiceInitialized) {
    throw new Error('Plugin subscription service is already initialized');
  }

  subscriptionServiceInitialized = true;

  const getExtensions = () => pluginStore.getExtensions();
  const getFlags = () => reduxStore.getState().FLAGS;

  type FeatureFlags = ReturnType<typeof getFlags>;

  const invokeExtensionListener = (sub: ExtensionSubscription, currentExtensions: Extension[]) => {
    // Narrow extensions according to type guards
    const matchedExtensions = _.flatMap(sub.typeGuards.map((tg) => currentExtensions.filter(tg)));

    // Invoke listener only if the extension list has changed
    if (!_.isEqual(matchedExtensions, sub.listenerLastArgs)) {
      sub.listenerLastArgs = matchedExtensions;
      sub.listener(matchedExtensions);
    }
  };

  onExtensionSubscriptionAdded = (sub) => {
    invokeExtensionListener(sub, getExtensions());
  };

  let lastExtensions: Extension[] = null;
  let lastFlags: FeatureFlags = null;

  const invokeAllExtensionListeners = () => {
    if (extensionSubscriptions.length === 0) {
      return;
    }

    const nextExtensions = getExtensions();
    const nextFlags = getFlags();

    if (_.isEqual(nextExtensions, lastExtensions) && nextFlags === lastFlags) {
      return;
    }

    lastExtensions = nextExtensions;
    lastFlags = nextFlags;

    extensionSubscriptions.forEach((sub) => {
      invokeExtensionListener(sub, nextExtensions);
    });
  };

  // Subscribe to changes in Console plugins and Redux
  pluginStore.subscribe([PluginEventType.ExtensionsChanged], invokeAllExtensionListeners);
  reduxStore.subscribe(invokeAllExtensionListeners);

  // Invoke listeners registered prior to initializing subscription service
  invokeAllExtensionListeners();
};

/**
 * Subscription based mechanism for consuming Console extensions.
 *
 * Provided listener will be invoked immediately to allow processing existing extensions.
 * It will also be invoked whenever the computed list of extension instances changes.
 *
 * _Tip: need to access extensions in a React component?_
 * - **Yes**
 *   - Use `useExtensions` hook.
 * - **No**
 *   - Use `subscribeToExtensions` function.
 *
 * @param listener Listener invoked when the list of extension instances which are
 * currently in use, narrowed by the given type guard(s), changes.
 *
 * @param typeGuards Type guard(s) used to narrow the extension instances.
 *
 * @deprecated - Use the `useExtensions`/`useResolvedExtensions` hooks only.
 *
 * @returns Function that unsubscribes the listener.
 */
export const subscribeToExtensions = <E extends Extension>(
  listener: ExtensionListener<LoadedExtension<E>>,
  ...typeGuards: ExtensionTypeGuard<E>[]
) => {
  if (typeGuards.length === 0) {
    throw new Error('You must pass at least one type guard to subscribeToExtensions');
  }

  const sub: ExtensionSubscription<E> = { listener, typeGuards };

  return subscribe<ExtensionSubscription>(sub, extensionSubscriptions, () => {
    onExtensionSubscriptionAdded(sub);
  });
};

/**
 * `ExtensionListener` adapter that computes the difference between the calls.
 */
export const extensionDiffListener = <E extends Extension>(
  listener: (added: E[], removed: E[]) => void,
): ExtensionListener<E> => {
  let prevExtensions: E[] = [];

  return (nextExtensions: E[]) => {
    listener(
      _.difference(nextExtensions, prevExtensions),
      _.difference(prevExtensions, nextExtensions),
    );

    prevExtensions = nextExtensions;
  };
};

type ExtensionListener<E extends Extension> = (extensions: E[]) => void;

type ExtensionSubscription<E extends Extension = Extension> = {
  listener: ExtensionListener<E>;
  typeGuards: ExtensionTypeGuard<E>[];
  listenerLastArgs?: E[];
};
