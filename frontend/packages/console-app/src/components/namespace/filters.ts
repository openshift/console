import { SYSTEM_NAMESPACES_PREFIX, SYSTEM_NAMESPACES } from '@console/shared';
// unsure why getActiveUserName is triggering a no-cycle error.
// eslint-disable-next-line import/no-cycle
import { getActiveUserName } from '../../../../../public/actions/ui';

export const isCurrentUser = (user: string): boolean => user === getActiveUserName();

export const isSystemNamespace = (option: { title: string; key?: string }) => {
  const startwithNamespace = SYSTEM_NAMESPACES_PREFIX.some((ns) => option.title?.startsWith(ns));
  const isNamespace = SYSTEM_NAMESPACES.includes(option.title);

  return startwithNamespace || isNamespace;
};

export const isOtherUser = (user: string, title: string): boolean => {
  return !isCurrentUser(user) && !isSystemNamespace({ title });
};

export const requestorFilter = (filter, obj): boolean => {
  if (filter.selected.size === 0) {
    return true;
  }

  const annotations = obj.metadata?.annotations;
  const requestor = annotations ? annotations['openshift.io/requester'] : undefined;
  if (filter.selected.has('me') && isCurrentUser(requestor)) {
    return true;
  }

  if (filter.selected.has('user') && isOtherUser(requestor, obj.metadata.name)) {
    return true;
  }

  if (filter.selected.has('system') && isSystemNamespace({ title: obj.metadata.name })) {
    return true;
  }

  return false;
};
