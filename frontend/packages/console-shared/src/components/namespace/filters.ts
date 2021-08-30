import { getActiveUserName } from '@console/internal/actions/ui';
import { SYSTEM_NAMESPACES_PREFIX, SYSTEM_NAMESPACES, REQUESTER_FILTER } from '@console/shared';

export const isCurrentUser = (user: string): boolean => user === getActiveUserName();

export const isSystemNamespace = (option: { title: string; key?: string }) => {
  const startsWithNamespace = SYSTEM_NAMESPACES_PREFIX.some((ns) => option.title?.startsWith(ns));
  const isNamespace = SYSTEM_NAMESPACES.includes(option.title);

  return startsWithNamespace || isNamespace;
};

export const isOtherUser = (user: string, title: string): boolean => {
  return !isCurrentUser(user) && !isSystemNamespace({ title });
};

export const requesterFilter = (filter, obj): boolean => {
  if (filter.selected.length === 0) {
    return true;
  }

  const annotations = obj.metadata?.annotations;
  const requester = annotations ? annotations['openshift.io/requester'] : undefined;
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
