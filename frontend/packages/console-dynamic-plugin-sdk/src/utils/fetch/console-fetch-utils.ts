import { getImpersonate } from '../../app/core/reducers';
import storeHandler from '../../app/storeHandler';

type ImpersonateHeaders = {
  'Impersonate-User': string;
};
export const getImpersonateHeaders = (): ImpersonateHeaders => {
  const store = storeHandler.getStore();
  if (!store) return undefined;

  const { kind, name } = getImpersonate(store.getState()) || {};
  if ((kind === 'User' || kind === 'Group') && name) {
    // Even if we are impersonating a group, we still need to set Impersonate-User to something or k8s will complain
    const headers = {
      'Impersonate-User': name,
    };
    if (kind === 'Group') {
      headers['Impersonate-Group'] = name;
    }
    return headers;
  }
  return undefined;
};
