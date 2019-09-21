import * as _ from 'lodash';
import { OwnerReference } from '@console/internal/module/k8s';

export const getAPIVersion = (ownerReference: OwnerReference) =>
  _.get(ownerReference, 'apiVersion') as OwnerReference['apiVersion'];

export const getKind = (ownerReference: OwnerReference) =>
  _.get(ownerReference, 'kind') as OwnerReference['kind'];

export const getName = (ownerReference: OwnerReference) =>
  _.get(ownerReference, 'name') as OwnerReference['name'];
