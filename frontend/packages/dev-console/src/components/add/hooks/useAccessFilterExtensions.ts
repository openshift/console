import { useMemo } from 'react';
import { AddAction, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import {
  AddAccessReviewResults,
  useAddActionsAccessReviews,
  AccessReviewStatus,
} from './useAddActionsAccessReviews';

export const useAccessFilterExtensions = (
  namespace: string,
  addActionExtensions: ResolvedExtension<AddAction>[],
): [ResolvedExtension<AddAction>[], boolean] => {
  const accessReviewResults: AddAccessReviewResults = useAddActionsAccessReviews(
    namespace,
    addActionExtensions,
  );
  const loaded = useMemo(
    () =>
      !Object.values(accessReviewResults).some(
        (reviewStatus) => reviewStatus === AccessReviewStatus.LOADING,
      ),
    [accessReviewResults],
  );

  return useMemo(
    () =>
      loaded
        ? [
            addActionExtensions.filter(
              ({ properties: { id } }) => accessReviewResults[id] === AccessReviewStatus.ALLOWED,
            ),
            loaded,
          ]
        : [[], loaded],
    [loaded, addActionExtensions, accessReviewResults],
  );
};
