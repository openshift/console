/* eslint-disable no-undef, no-unused-vars */

import { PackageManifestKind, SubscriptionKind } from '../operator-lifecycle-manager';

export const OPERATOR_HUB_CSC_BASE = 'marketplace-enabled-operators';

export type OperatorHubItem = {
  obj: PackageManifestKind;
  name: string;
  kind: string;
  uid: string;
  installed: boolean;
  subscription?: SubscriptionKind
  provider: string;
  longDescription: string;
  description: string;
  createdAt: string;
  tags: string[];
  categories: string[];
  catalogSource: string;
  catalogSourceNamespace: string;
  [key: string]: any;
};
