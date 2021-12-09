import { DeploymentModel } from '@console/internal/models';
import {
  k8sGet,
  k8sPatch,
  K8sResourceKind,
  modelFor,
  referenceFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { edgesFromAnnotations, doConnectsToBinding } from '../connector-utils';

jest.mock('@console/internal/module/k8s', () => ({
  k8sGet: jest.fn(),
  k8sPatch: jest.fn(),
  modelFor: jest.fn(),
  referenceFor: jest.fn(),
  referenceForModel: jest.fn(),
}));

const k8sGetMock = k8sGet as jest.Mock;
const k8sPatchMock = k8sPatch as jest.Mock;
const modelForMock = modelFor as jest.Mock;
const referenceForModelMock = referenceForModel as jest.Mock;
const referenceForMock = referenceFor as jest.Mock;

describe('connector-utils', () => {
  describe('edgeFromAnnotations utils', () => {
    it('should return empty array if connects-to annotation is not present', () => {
      expect(edgesFromAnnotations({})).toEqual([]);
    });

    it('should return string value if connects-to anotation as single value', () => {
      expect(edgesFromAnnotations({ 'app.openshift.io/connects-to': 'abcd' })).toEqual(['abcd']);
    });

    it('should return array of values if connects-to anotation as multiple value', () => {
      expect(
        edgesFromAnnotations({ 'app.openshift.io/connects-to': 'abcd, mock, value' }),
      ).toEqual(['abcd', 'mock', 'value']);
    });
  });

  describe('doConnectsToBinding', () => {
    afterAll(() => {
      jest.resetAllMocks();
    });

    it('should fail when there is no context source', async () => {
      await expect(doConnectsToBinding([], '')).rejects.toBeInstanceOf(Error);
    });

    it('should patch annotation to target resource', async () => {
      const target = {
        metadata: {
          name: 'test-deployment',
          namespace: 'test',
        },
      } as K8sResourceKind;
      const mockResource = { metadata: { name: 'test-resource' } };
      referenceForMock.mockReturnValue('apps/v1');
      referenceForModelMock.mockReturnValue('apps/v1');
      k8sGetMock.mockReturnValue(mockResource);
      modelForMock.mockReturnValue(DeploymentModel);

      await expect(doConnectsToBinding([target], 'apps/Deployment')).resolves.toBeTruthy();
      expect(k8sPatchMock).toHaveBeenCalledWith(DeploymentModel, mockResource, [
        expect.objectContaining({ op: 'add', path: '/metadata/annotations' }),
      ]);
    });

    it('should fail when context resource is not found', async () => {
      const target = {
        metadata: {
          name: 'test-deployment',
          namespace: 'test',
        },
      } as K8sResourceKind;
      referenceForMock.mockReturnValue('apps/v1');
      referenceForModelMock.mockReturnValue('apps/v1');
      k8sGetMock.mockReturnValue({});

      await expect(doConnectsToBinding([target], 'apps/Deployment')).rejects.toBeInstanceOf(Error);
    });
  });
});
