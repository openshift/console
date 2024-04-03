import { useLastNamespace } from '@console/dynamic-plugin-sdk/src/lib-internal';
import { ALL_NAMESPACES_KEY, useActiveNamespace } from '@console/shared/src';
import { ALL_NAMESPACES } from './constants';

type UseActiveNamespacePathType = () => string;

export const buildNSPath = (namespace: string): string =>
  [ALL_NAMESPACES, ALL_NAMESPACES_KEY].includes(namespace) ? ALL_NAMESPACES : `ns/${namespace}`;

export const useLastNamespacePath: UseActiveNamespacePathType = () => {
  const [lastNamespace] = useLastNamespace();
  const [activeNamespace] = useActiveNamespace();

  return !lastNamespace ? buildNSPath(activeNamespace) : buildNSPath(lastNamespace);
};
