import { act } from 'react-dom/test-utils';
import { checkAccess } from '@console/internal/components/utils';
import {
  AccessReviewResourceAttributes,
  SelfSubjectAccessReviewKind,
} from '@console/internal/module/k8s';
import { testHook } from '../../../../../../../__tests__/utils/hooks-utils';
import { addActionExtensions } from '../../__tests__/add-page-test-data';
import { useAddActionsAccessReviews, AccessReviewStatus } from '../useAddActionsAccessReviews';

jest.mock('@console/internal/components/utils', () => ({
  checkAccess: jest.fn(),
}));
const createCheckAccessPromise = (val: boolean): Promise<SelfSubjectAccessReviewKind> =>
  Promise.resolve({
    apiVersion: '',
    kind: 'SelfSubjectAccessReviewKind',
    spec: {},
    status: {
      allowed: val,
    },
  });
const namespace = 'ns';

describe('useAddActionsAccessReviews', () => {
  afterEach(() => jest.resetAllMocks());

  it('should return access review status denied for all access reviews if every extension has an accessReview prop and accessReviewResult is false for all of them', async () => {
    (checkAccess as jest.Mock).mockReturnValue(createCheckAccessPromise(false));
    const extensionsWithAccessReview = addActionExtensions.filter(
      (action) => !!action.properties.accessReview,
    );
    const { result, rerender } = testHook(() =>
      useAddActionsAccessReviews(namespace, extensionsWithAccessReview),
    );
    await act(async () => {
      rerender();
    });
    const accessReviewResults = Object.values(result.current);
    expect(accessReviewResults.length).toEqual(extensionsWithAccessReview.length);
    expect(accessReviewResults.every((x) => x === AccessReviewStatus.DENIED)).toBe(true);
  });

  it('should return access review status allowed for all extensions which do not have an accessReview prop', () => {
    const extensionsWithoutAccessReview = addActionExtensions.filter(
      (action) => !action.properties.accessReview,
    );
    const { result } = testHook(() =>
      useAddActionsAccessReviews(namespace, extensionsWithoutAccessReview),
    );
    const accessReviewResults = Object.values(result.current);
    expect(accessReviewResults.length).toEqual(extensionsWithoutAccessReview.length);
    expect(accessReviewResults.every((x) => x === AccessReviewStatus.ALLOWED)).toBe(true);
  });

  it('should return accessReviewResults with proper access review status for all extensions which have an accessReview prop and accessReviewResult is true', async () => {
    (checkAccess as jest.Mock).mockReturnValue(createCheckAccessPromise(true));
    const extensionsWithAccessReview = addActionExtensions.filter(
      (action) => !!action.properties.accessReview,
    );
    const { result, rerender } = testHook(() =>
      useAddActionsAccessReviews(namespace, extensionsWithAccessReview),
    );
    await act(async () => {
      rerender();
    });
    const accessReviewResults = Object.values(result.current);
    expect(accessReviewResults.length).toEqual(extensionsWithAccessReview.length);
    expect(accessReviewResults.every((x) => x === AccessReviewStatus.ALLOWED)).toBe(true);
  });

  it('should return accessReviewResults with proper access review status for extensions which do not have an accessReview prop or for which accessReviewResult is true', async () => {
    const mockAccessGroup = 'build.openshift.io';
    const extensionsWithMockAccessGroup = addActionExtensions.filter(
      ({ properties: { accessReview } }) =>
        !accessReview || (accessReview.length === 1 && accessReview[0].group === mockAccessGroup),
    );
    const extensionsWithoutMockAccessGroup = addActionExtensions.filter(
      ({ properties: { accessReview } }) =>
        accessReview && accessReview[0].group !== mockAccessGroup,
    );

    (checkAccess as jest.Mock).mockImplementation(
      (resourceAttributes: AccessReviewResourceAttributes) =>
        createCheckAccessPromise(resourceAttributes.group === mockAccessGroup),
    );
    const { result, rerender } = testHook(() =>
      useAddActionsAccessReviews(namespace, addActionExtensions),
    );
    await act(async () => {
      rerender();
    });
    expect(Object.entries(result.current).length).toEqual(addActionExtensions.length);
    extensionsWithMockAccessGroup.forEach((ext) => {
      expect(result.current[ext.properties.id]).toBe(AccessReviewStatus.ALLOWED);
    });
    extensionsWithoutMockAccessGroup.forEach((ext) => {
      expect(result.current[ext.properties.id]).toBe(AccessReviewStatus.DENIED);
    });
  });
});
