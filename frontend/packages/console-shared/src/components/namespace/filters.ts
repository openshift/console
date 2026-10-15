import { getActiveUserName } from '@console/internal/actions/ui';
import {
  SYSTEM_NAMESPACES_PREFIX,
  SYSTEM_NAMESPACES,
  REQUESTER_FILTER,
} from '@console/shared/src/constants/common';

export const isCurrentUser = (user: string): boolean => user === getActiveUserName();

export const isSystemNamespace = (option: { title: string; key?: string }) => {
  const startsWithNamespace = SYSTEM_NAMESPACES_PREFIX.some((ns) => option.title?.startsWith(ns));
  const isNamespace = SYSTEM_NAMESPACES.includes(option.title);

  return startsWithNamespace || isNamespace;
};

const normalizeNamespaceSearchText = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[-_.\s/]+/g, '');

export const matchesNamespaceFilterText = (
  filterText: string,
  namespace: {
    title?: string;
    key?: string;
    metadata?: {
      name?: string;
      annotations?: Record<string, string>;
      labels?: Record<string, string>;
    };
  },
): boolean => {
  if (!filterText) {
    return true;
  }

  const normalizedFilterText = normalizeNamespaceSearchText(filterText ?? '');
  const values: string[] = [
    namespace.title,
    namespace.metadata?.name ?? '',
    namespace.metadata?.annotations?.['openshift.io/display-name'] ?? '',
    ...Object.entries(namespace.metadata?.labels ?? {}).map(([key, value]) => `${key}=${value}`),
    ...Object.entries(namespace.metadata?.annotations ?? {}).map(
      ([key, value]) => `${key}=${value}`,
    ),
  ].filter(Boolean);

  return values.some((value) => normalizeNamespaceSearchText(value).includes(normalizedFilterText));
};

export const isOtherUser = (user: string, title: string): boolean =>
  !isCurrentUser(user) && !isSystemNamespace({ title });

export const requesterFilter = (filter, obj): boolean => {
  if (filter.selected.length === 0) {
    return true;
  }

  const requester = obj.metadata?.annotations?.['openshift.io/requester'];
  if (filter.selected.includes(REQUESTER_FILTER.ME) && isCurrentUser(requester)) {
    return true;
  }

  if (
    filter.selected.includes(REQUESTER_FILTER.USER) &&
    isOtherUser(requester, obj.metadata.name)
  ) {
    return true;
  }

  if (
    filter.selected.includes(REQUESTER_FILTER.SYSTEM) &&
    isSystemNamespace({ title: obj.metadata.name })
  ) {
    return true;
  }

  return false;
};
