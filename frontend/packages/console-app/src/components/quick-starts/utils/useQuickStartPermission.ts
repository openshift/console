import { useAccessReview2 } from '@console/internal/components/utils';
import { flagPending } from '@console/internal/reducers/features';
import { useFlag } from '@console/shared/src/hooks/flag';
import { QuickStart } from './quick-start-types';

const useQuickStartPermission = (quickStart: QuickStart): [boolean, boolean] => {
  const {
    spec: { accessReviewResources, flags },
  } = quickStart;

  const accessReviews = [];
  const accessReviewsLoading = [];

  const requiredFlags = [];
  const requiredFlagsPending = [];

  const disallowedFlags = [];
  const disallowedFlagsPending = [];

  if (accessReviewResources) {
    accessReviewResources.forEach((descriptor) => {
      // access review resources for a specific quick start is going to be static so the order will not change
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [review, loading] = useAccessReview2(descriptor);
      accessReviews.push(review);
      accessReviewsLoading.push(loading);
    });
  }

  if (flags?.required) {
    flags.required.forEach((requiredFlag) => {
      // flags for a specific quick start is going to be static so the order will not change
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const flag = useFlag(requiredFlag);
      const pending = flagPending(flag);
      requiredFlags.push(flag);
      requiredFlagsPending.push(pending);
    });
  }

  if (flags?.disallowed) {
    flags.disallowed.forEach((disallowedFlag) => {
      // flags for a specific quick start is going to be static so the order will not change
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const flag = useFlag(disallowedFlag);
      const pending = flagPending(flag);
      disallowedFlags.push(flag);
      disallowedFlagsPending.push(pending);
    });
  }

  const hasAccess = !accessReviewResources || accessReviews.every((review) => review);

  const hasRequiredFlags = !flags?.required || requiredFlags.every((x) => x);

  const hasDisallowedFlags = disallowedFlags.some((x) => x);

  const hasPermission = hasAccess && hasRequiredFlags && !hasDisallowedFlags;

  const loaded =
    accessReviewsLoading.every((loading) => !loading) &&
    requiredFlagsPending.every((pending) => !pending) &&
    disallowedFlagsPending.every((pending) => !pending);

  return [loaded && hasPermission, loaded];
};

export default useQuickStartPermission;
