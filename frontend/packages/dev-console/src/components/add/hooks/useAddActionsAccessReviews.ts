import * as React from 'react';
import { checkAccess } from '@console/internal/components/utils';
import { AddAction, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { SelfSubjectAccessReviewKind } from '@console/internal/module/k8s';

export type AddAccessReviewResults = {
  [addActionId: string]: AccessReviewStatus;
};
export type NamespacedAddAccessReviewResults = {
  [namespace: string]: AddAccessReviewResults;
};
export enum AccessReviewStatus {
  LOADING = 'loading',
  ALLOWED = 'allowed',
  DENIED = 'denied',
  FAILED = 'failed',
}
export const useAddActionsAccessReviews = (
  namespace: string,
  addActionExtensions: ResolvedExtension<AddAction>[],
): AddAccessReviewResults => {
  const [namespacedAccessReviewResults, setNamespacedAccessReviewResults] = React.useState<
    NamespacedAddAccessReviewResults
  >({});
  const setAccessReviewResults = React.useCallback(
    (newResults: AddAccessReviewResults) => {
      setNamespacedAccessReviewResults((oldResults) => ({
        ...oldResults,
        [namespace]: {
          ...oldResults[namespace],
          ...newResults,
        },
      }));
    },
    [namespace, setNamespacedAccessReviewResults],
  );
  React.useEffect(() => {
    const newAddActions = addActionExtensions.filter(
      ({ properties: { id } }) => !namespacedAccessReviewResults[namespace]?.[id],
    );
    if (newAddActions.length === 0) {
      return;
    }
    const newResults = newAddActions.reduce((acc, { properties: { id, accessReview } }) => {
      acc[id] = accessReview ? AccessReviewStatus.LOADING : AccessReviewStatus.ALLOWED;
      return acc;
    }, {} as AddAccessReviewResults);
    setAccessReviewResults(newResults);
    newAddActions.forEach(({ properties: { id, accessReview } }) => {
      if (accessReview) {
        const promises = accessReview.map((resourceAttributes) =>
          checkAccess({ ...resourceAttributes, namespace }),
        );
        Promise.all(promises)
          .then((values: SelfSubjectAccessReviewKind[]) => {
            const isAllowed = values.every((result) => result.status?.allowed);
            setAccessReviewResults({
              [id]: isAllowed ? AccessReviewStatus.ALLOWED : AccessReviewStatus.DENIED,
            });
          })
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.warn('SelfSubjectAccessReview failed', e);
            setAccessReviewResults({
              [id]: AccessReviewStatus.FAILED,
            });
          });
      }
    });
  }, [addActionExtensions, namespace, namespacedAccessReviewResults, setAccessReviewResults]);
  return namespacedAccessReviewResults[namespace] || {};
};
