import * as _ from 'lodash';

import { OAuthModel } from '../../models';
import {
  IdentityProvider,
  k8sGet,
  k8sPatch,
  OAuthKind,
} from '../../module/k8s';
import {
  history,
  resourcePathFromModel,
} from '../utils';

// The name of the cluster-scoped OAuth configuration resource.
const OAUTH_RESOURCE_NAME = 'cluster';

export const getOAuthResource = (): Promise<OAuthKind> => k8sGet(OAuthModel, OAUTH_RESOURCE_NAME);

export const addIDP = (oauth: OAuthKind, idp: IdentityProvider): Promise<OAuthKind> => {
  const patch = _.isEmpty(oauth.spec.identityProviders)
    ? { op: 'add', path: '/spec/identityProviders', value: [idp] }
    : { op: 'add', path: '/spec/identityProviders/-', value: idp };
  return k8sPatch(OAuthModel, oauth, [patch]);
};

export const redirectToOAuthPage = () => {
  const path = resourcePathFromModel(OAuthModel, OAUTH_RESOURCE_NAME);
  history.push(path);
};
