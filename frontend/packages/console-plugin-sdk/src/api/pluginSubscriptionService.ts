import * as _ from 'lodash';
import { Store } from 'redux';
import { RootState } from '@console/internal/redux';
import { isExtensionInUse, PluginStore, DynamicPluginInfo } from '../store';
import { Extension, ExtensionTypeGuard, LoadedExtension } from '../typings';

let subscriptionServiceInitialized = false;

const extensionSubscriptions: ExtensionSubscription[] = [];
const dynamicPluginListeners: DynamicPluginListener[] = [];

let onExtensionSubscriptionAdded: (sub: ExtensionSubscription) => void = _.noop;
let onDynamicPluginListenerAdded: (listener: DynamicPluginListener) => void = _.noop;

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
    throw new Error('Subscription service is already initialized');
  }

  subscriptionServiceInitialized = true;

  const getAllExtensions = () => pluginStore.getAllExtensions();
  const getAllFlags = () => reduxStore.getState().FLAGS;

  type FeatureFlags = ReturnType<typeof getAllFlags>;

  const invokeExtensionListener = (
    sub: ExtensionSubscription,
    currentExtensions: Extension[],
    currentFlags: FeatureFlags,
  ) => {
    // Narrow extensions according to type guards
    const matchedExtensions = _.flatMap(sub.typeGuards.map((tg) => currentExtensions.filter(tg)));

    // Gate matched extensions by relevant feature flags
    const extensionsInUse = matchedExtensions.filter((e) =>
      isExtensionInUse(e, currentFlags.toObject()),
    );

    // Invoke listener only if the extension list has changed
    if (!_.isEqual(extensionsInUse, sub.listenerLastArgs)) {
      sub.listenerLastArgs = extensionsInUse;
      sub.listener(extensionsInUse);
    }
  };

  onExtensionSubscriptionAdded = (sub) => {
    invokeExtensionListener(sub, getAllExtensions(), getAllFlags());
  };

  onDynamicPluginListenerAdded = (listener) => {
    listener(pluginStore.getDynamicPluginInfo());
  };

  let lastExtensions: Extension[] = null;
  let lastFlags: FeatureFlags = null;

  const invokeAllExtensionListeners = () => {
    if (extensionSubscriptions.length === 0) {
      return;
    }

    const nextExtensions = getAllExtensions();
    const nextFlags = getAllFlags();

    if (_.isEqual(nextExtensions, lastExtensions) && nextFlags === lastFlags) {
      return;
    }

    lastExtensions = nextExtensions;
    lastFlags = nextFlags;

    extensionSubscriptions.forEach((sub) => {
      invokeExtensionListener(sub, nextExtensions, nextFlags);
    });
  };

  let lastPluginEntries: DynamicPluginInfo[] = null;

  const invokeAllDynamicPluginListeners = () => {
    if (dynamicPluginListeners.length === 0) {
      return;
    }

    const nextPluginEntries = pluginStore.getDynamicPluginInfo();

    if (_.isEqual(nextPluginEntries, lastPluginEntries)) {
      return;
    }

    lastPluginEntries = nextPluginEntries;

    dynamicPluginListeners.forEach((listener) => {
      listener(nextPluginEntries);
    });
  };

  // Subscribe to changes in Console plugins and Redux
  pluginStore.subscribe(invokeAllExtensionListeners);
  pluginStore.subscribe(invokeAllDynamicPluginListeners);
  reduxStore.subscribe(invokeAllExtensionListeners);

  // Invoke listeners registered prior to initializing subscription service
  invokeAllExtensionListeners();
  invokeAllDynamicPluginListeners();
};

/**
 * Subscription based mechanism for consuming Console extensions.
 *
 * Provided listener will be invoked immediately to allow processing existing extensions.
 * It will also be invoked whenever the computed list of extension instances changes.
 *
 * _Tip: need to access extensions in a React component?_
 * - **Yes**
 *   - Functional components: use `useExtensions` hook.
 *   - Class components: use `withExtensions` higher-order component.
 * - **No**
 *   - Use `subscribeToExtensions` function.
 *
 * @param listener Listener invoked when the list of extension instances which are
 * currently in use, narrowed by the given type guard(s), changes.
 *
 * @param typeGuards Type guard(s) used to narrow the extension instances.
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
 * Subscribe to changes related to processing Console dynamic plugins.
 *
 * @param listener Listener invoked when the runtime status of a dynamic plugin changes.
 *
 * @returns Function that unsubscribes the listener.
 */
export const subscribeToDynamicPlugins = (listener: DynamicPluginListener) => {
  return subscribe<DynamicPluginListener>(listener, dynamicPluginListeners, () => {
    onDynamicPluginListenerAdded(listener);
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

type DynamicPluginListener = (pluginEntries: DynamicPluginInfo[]) => void;
