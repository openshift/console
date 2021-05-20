import { addActionExtensions } from '../../__tests__/add-page-test-data';
import { useAccessFilterExtensions } from '../useAccessFilterExtensions';
import * as hook from '../useAddActionsAccessReviews';

const namespace = 'ns';
const { AccessReviewStatus } = hook;

describe('useAccessFilterExtensions', () => {
  const useAddActionsAccessReviewsSpy = jest.spyOn(hook, 'useAddActionsAccessReviews');
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return empty array and loaded with value false if all results from useAddActionsAccessReviews have not loaded', () => {
    const mockAddAccessReviewResults: hook.AddAccessReviewResults = {
      'dev-catalog': AccessReviewStatus.LOADING,
      'import-from-git': AccessReviewStatus.ALLOWED,
      pipeline: AccessReviewStatus.ALLOWED,
      'deploy-image': AccessReviewStatus.ALLOWED,
    };
    useAddActionsAccessReviewsSpy.mockReturnValue(mockAddAccessReviewResults);
    const [filteredAddActionExtensions, loaded] = useAccessFilterExtensions(
      namespace,
      addActionExtensions,
    );
    expect(filteredAddActionExtensions.length).toEqual(0);
    expect(loaded).toBe(false);
  });

  it('should return filtered array of add actions for which access review status is allowed and loaded with value true', () => {
    const mockAccessReviewResults = {
      'dev-catalog': AccessReviewStatus.ALLOWED,
      'import-from-git': AccessReviewStatus.DENIED,
      pipeline: AccessReviewStatus.FAILED,
      'deploy-image': AccessReviewStatus.ALLOWED,
    };
    const accessAllowedResults = Object.values(mockAccessReviewResults).filter(
      (result) => result === AccessReviewStatus.ALLOWED,
    );
    useAddActionsAccessReviewsSpy.mockReturnValue(mockAccessReviewResults);
    const [filteredAddActionExtensions, loaded] = useAccessFilterExtensions(
      namespace,
      addActionExtensions,
    );
    expect(filteredAddActionExtensions.length).toEqual(accessAllowedResults.length);
    expect(loaded).toBe(true);
  });
});
