import * as React from 'react';
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
  const loaded = React.useMemo(
    () =>
      !Object.values(accessReviewResults).some(
        (reviewStatus) => reviewStatus === AccessReviewStatus.LOADING,
      ),
    [accessReviewResults],
  );

  return React.useMemo(
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
