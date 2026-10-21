import { ALL_NAMESPACES_KEY } from '../constants';

/**
 * Returns true if the provided value represents the special "all" namespaces option key.
 */
export const isAllNamespacesKey = (ns: string) => ns === ALL_NAMESPACES_KEY;
