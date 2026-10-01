import * as _ from 'lodash';
import { ClusterServiceVersionModel } from '../models';
import type { ClusterServiceVersionKind, SubscriptionKind } from '../types';

const isCSV = (
  obj: ClusterServiceVersionKind | SubscriptionKind,
): obj is ClusterServiceVersionKind => obj.kind === ClusterServiceVersionModel.kind;

/**
 * Produces the set of installed Classic operators: every ClusterServiceVersion, plus any
 * Subscription that has not yet produced one. A Subscription therefore only surfaces while
 * its install is in flight or stuck.
 */
export const mergeInstalledOperators = (
  globalCSVs: ClusterServiceVersionKind[],
  namespacedCSVs: ClusterServiceVersionKind[],
  subscriptions: SubscriptionKind[],
  namespace: string,
): (ClusterServiceVersionKind | SubscriptionKind)[] => {
  const csvs = [...(globalCSVs ?? []), ...(namespacedCSVs ?? [])];
  const pendingSubscriptions = (subscriptions ?? []).filter(
    (sub) =>
      ['', sub.metadata.namespace].includes(namespace || '') &&
      _.isNil(_.get(sub, 'status.installedCSV')),
  );

  const all = [...csvs, ...pendingSubscriptions];
  return all.filter(
    (obj) =>
      isCSV(obj) ||
      _.isUndefined(
        all.find(({ metadata }) =>
          [obj?.status?.currentCSV, obj?.spec?.startingCSV].includes(metadata?.name),
        ),
      ),
  );
};
