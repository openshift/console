import { useAccessReview } from '@console/internal/components/utils';
import { useFlag } from '@console/shared/src/hooks/flag';
import { QuickStart } from './quick-start-types';
import { getQuickStarts } from './quick-start-utils';

const useQuickStarts = (): QuickStart[] => {
  const quickStarts = getQuickStarts();

  const filteredQuickStarts = quickStarts.filter((quickStart) => {
    const {
      spec: { accessReviewResources, flags },
    } = quickStart;

    const hasAccess =
      !accessReviewResources ||
      // all the quick starts are static at the moment so the order will not change
      // eslint-disable-next-line react-hooks/rules-of-hooks
      accessReviewResources.map((descriptor) => useAccessReview(descriptor)).every((x) => x);

    const requiredFlags =
      !flags?.required ||
      // all the quick starts are static at the moment so the order will not change
      // eslint-disable-next-line react-hooks/rules-of-hooks
      flags?.required?.map((flag) => useFlag(flag)).every((x) => x);

    // all the quick starts are static at the moment so the order will not change
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const disallowedFlags = flags?.disallowed?.map((flag) => useFlag(flag)).some((x) => x);

    return hasAccess && requiredFlags && !disallowedFlags;
  });

  return filteredQuickStarts;
};

export default useQuickStarts;
