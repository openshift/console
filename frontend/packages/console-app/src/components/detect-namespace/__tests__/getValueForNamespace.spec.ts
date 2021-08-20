import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';
import { checkNamespaceExists } from '../checkNamespaceExists';
import { getValueForNamespace } from '../getValueForNamespace';

jest.mock('../checkNamespaceExists', () => ({
  checkNamespaceExists: jest.fn(),
}));

const checkNamespaceExistsMock = checkNamespaceExists as jest.Mock;

const fallbackNamespace = 'fallback-ns';
const preferredNamespace: string = 'preferred-ns';
const lastNamespace: string = 'last-ns';

describe('getValueForNamespace', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return fallbackNamespace as value for namespace if it is defined and exists', async () => {
    checkNamespaceExistsMock.mockReturnValueOnce(Promise.resolve(true));

    const namespace = await getValueForNamespace(
      true,
      fallbackNamespace,
      preferredNamespace,
      lastNamespace,
    );

    expect(namespace).toEqual(fallbackNamespace);
  });

  it(`should return preferredNamespace as value for namespace if it is defined and exists, and fallbackNamespace are not defined or do not exist`, async () => {
    checkNamespaceExistsMock.mockReturnValueOnce(Promise.resolve(true));

    const namespace = await getValueForNamespace(true, null, preferredNamespace, lastNamespace);

    expect(namespace).toEqual(preferredNamespace);
  });

  it('should return preferredNamespace as value for namespace if it is defined and exists, and fallbackNamespace is defined but does not exist', async () => {
    checkNamespaceExistsMock
      .mockReturnValueOnce(Promise.resolve(false))
      .mockReturnValueOnce(Promise.resolve(true));

    const namespace = await getValueForNamespace(
      true,
      fallbackNamespace,
      preferredNamespace,
      lastNamespace,
    );

    expect(namespace).toEqual(preferredNamespace);
  });

  it(`should return lastNamespace as value for namespace if it is defined and exists, and fallbackNamespace, 
    preferredNamespace are not defined or do not exist`, async () => {
    checkNamespaceExistsMock
      .mockReturnValueOnce(Promise.resolve(false))
      .mockReturnValueOnce(Promise.resolve(true));

    const namespace = await getValueForNamespace(true, null, preferredNamespace, lastNamespace);

    expect(namespace).toEqual(lastNamespace);
  });

  it(`should return ${ALL_NAMESPACES_KEY} as value for namespace if all of the parameters for namespace are not defined or do not exist`, async () => {
    checkNamespaceExistsMock
      .mockReturnValueOnce(Promise.resolve(false))
      .mockReturnValueOnce(Promise.resolve(false));

    const namespace = await getValueForNamespace(true, null, preferredNamespace, lastNamespace);

    expect(namespace).toEqual(ALL_NAMESPACES_KEY);
  });
});
