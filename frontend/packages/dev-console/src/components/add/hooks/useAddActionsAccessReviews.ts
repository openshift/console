import { useState, useCallback, useEffect, useRef } from 'react';
import type { AddAction, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { checkAccess } from '@console/internal/components/utils';
import type { SelfSubjectAccessReviewKind } from '@console/internal/module/k8s';

export type AddAccessReviewResults = {
  [addActionId: string]: AccessReviewStatus;
};
type NamespacedAddAccessReviewResults = {
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
  const [namespacedAccessReviewResults, setNamespacedAccessReviewResults] =
    useState<NamespacedAddAccessReviewResults>({});
  const setAccessReviewResults = useCallback(
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

  const currentResults = namespacedAccessReviewResults[namespace];
  const newResults = addActionExtensions.reduce((acc, { properties: { id, accessReview } }) => {
    if (!currentResults?.[id]) {
      acc[id] = accessReview ? AccessReviewStatus.LOADING : AccessReviewStatus.ALLOWED;
    }
    return acc;
  }, {} as AddAccessReviewResults);
  if (Object.keys(newResults).length > 0) {
    setAccessReviewResults(newResults);
  }

  // Track the reviews already sent to the API so re-running the effect (for
  // example when another action's review resolves) does not fetch them again.
  const requestedReviewsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    addActionExtensions.forEach(({ properties: { id, accessReview } }) => {
      const reviewKey = `${namespace}/${id}`;
      if (
        accessReview &&
        namespacedAccessReviewResults[namespace]?.[id] === AccessReviewStatus.LOADING &&
        !requestedReviewsRef.current.has(reviewKey)
      ) {
        requestedReviewsRef.current.add(reviewKey);
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
