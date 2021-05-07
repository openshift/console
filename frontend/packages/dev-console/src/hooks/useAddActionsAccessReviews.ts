import * as React from 'react';
import { checkAccess } from '@console/internal/components/utils';
import { AddAction, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { SelfSubjectAccessReviewKind } from '@console/internal/module/k8s';

export type AddAccessReviewResults = {
  [addActionId: string]: AccessReviewStatus;
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
  const initialState = (): AddAccessReviewResults =>
    addActionExtensions.reduce((acc, curr) => {
      const {
        properties: { id, accessReview },
      } = curr;
      acc[id] = accessReview ? AccessReviewStatus.LOADING : AccessReviewStatus.ALLOWED;
      return acc;
    }, {});
  const [accessReviewResults, setAccessReviewResults] = React.useState<AddAccessReviewResults>(
    initialState,
  );

  React.useEffect(() => {
    addActionExtensions?.forEach(({ properties: { id, accessReview } }) => {
      if (accessReviewResults[id] === AccessReviewStatus.LOADING) {
        const promises = accessReview.map((resourceAttributes) =>
          checkAccess({ ...resourceAttributes, namespace }),
        );
        Promise.all(promises)
          .then((values: SelfSubjectAccessReviewKind[]) => {
            const isAllowed: boolean = values
              .map((result) => result.status?.allowed)
              .every((x) => x);
            setAccessReviewResults((results) => ({
              ...results,
              [id]: isAllowed ? AccessReviewStatus.ALLOWED : AccessReviewStatus.DENIED,
            }));
          })
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.warn('SelfSubjectAccessReview failed', e);
            setAccessReviewResults((results) => ({ ...results, [id]: AccessReviewStatus.FAILED }));
          });
      }
    });
  }, [accessReviewResults, addActionExtensions, namespace]);

  return accessReviewResults;
};
