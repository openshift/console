import { useRef, useEffect } from 'react';
import type { Extension, LoadedExtension } from '@openshift/dynamic-plugin-sdk';
import { difference } from 'lodash';

/**
 * Track changes in `extensions` array and invoke `onChange` function when new extensions
 * are added or existing extensions are removed.
 *
 * The hook assumes that `extensions` array is referentially stable across re-renders.
 *
 * This hook does not modify provided extension objects.
 */
export const useCompareExtensions = <TExtension extends Extension>(
  extensions: LoadedExtension<TExtension>[],
  onChange: (added: LoadedExtension<TExtension>[], removed: LoadedExtension<TExtension>[]) => void,
) => {
  const prevExtensionsRef = useRef<LoadedExtension<TExtension>[]>([]);

  useEffect(() => {
    const added = difference(extensions, prevExtensionsRef.current);
    const removed = difference(prevExtensionsRef.current, extensions);

    if (added.length > 0 || removed.length > 0) {
      onChange(added, removed);
      prevExtensionsRef.current = extensions;
    }
  }, [extensions, onChange]);
};
