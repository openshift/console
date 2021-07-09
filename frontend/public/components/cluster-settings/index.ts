import * as _ from 'lodash-es';

import { OAuthModel } from '../../models';
import { IdentityProvider, k8sGet, k8sPatch, OAuthKind } from '../../module/k8s';
import { history, resourcePathFromModel } from '../utils';

// The name of the cluster-scoped OAuth configuration resource.
const OAUTH_RESOURCE_NAME = 'cluster';

export const getOAuthResource = (): Promise<OAuthKind> => k8sGet(OAuthModel, OAUTH_RESOURCE_NAME);

export const addIDP = (
  oauth: OAuthKind,
  idp: IdentityProvider,
  dryRun?: boolean,
): Promise<OAuthKind> => {
  const patch = _.isEmpty(oauth.spec.identityProviders)
    ? { op: 'add', path: '/spec/identityProviders', value: [idp] }
    : { op: 'add', path: '/spec/identityProviders/-', value: idp };
  return k8sPatch(OAuthModel, oauth, [patch], dryRun ? { queryParams: { dryRun: 'All' } } : {});
};

export const redirectToOAuthPage = () => {
  const path = `${resourcePathFromModel(OAuthModel, OAUTH_RESOURCE_NAME)}?idpAdded=true`;
  history.push(path);
};

export const mockNames = {
  secret: 'secret-name',
  ca: 'ca-name',
};
