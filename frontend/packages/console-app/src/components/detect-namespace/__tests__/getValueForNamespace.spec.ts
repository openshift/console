import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';
import { checkNamespaceExists } from '../checkNamespaceExists';
import { getValueForNamespace } from '../getValueForNamespace';

jest.mock('../checkNamespaceExists', () => ({
  checkNamespaceExists: jest.fn(),
}));

const checkNamespaceExistsMock = checkNamespaceExists as jest.Mock;

const activeNamespace: string = 'active-ns';
const preferredNamespace: string = 'preferred-ns';
const lastNamespace: string = 'last-ns';

describe('getValueForNamespace', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it(`should return activeNamespace if it is defined and exists`, async () => {
    checkNamespaceExistsMock.mockReturnValueOnce(Promise.resolve(true));

    const namespace = await getValueForNamespace(
      preferredNamespace,
      lastNamespace,
      true,
      activeNamespace,
    );

    expect(namespace).toEqual(activeNamespace);
  });

  it(`should return preferredNamespace if activeNamespace does not exist and preferredNamespace is defined and exists`, async () => {
    checkNamespaceExistsMock
      .mockReturnValueOnce(Promise.resolve(false))
      .mockReturnValueOnce(Promise.resolve(true));
    const namespace = await getValueForNamespace(
      preferredNamespace,
      lastNamespace,
      true,
      activeNamespace,
    );

    expect(namespace).toEqual(preferredNamespace);
  });

  it('should return lastNamespace if activeNamespace and preferred namespace does not exist and last namespace is defined and exists', async () => {
    checkNamespaceExistsMock
      .mockReturnValueOnce(Promise.resolve(false))
      .mockReturnValueOnce(Promise.resolve(false))
      .mockReturnValueOnce(Promise.resolve(true));

    const namespace = await getValueForNamespace(
      preferredNamespace,
      lastNamespace,
      true,
      activeNamespace,
    );

    expect(namespace).toEqual(lastNamespace);
  });

  it(`should return ${ALL_NAMESPACES_KEY} if activeNamespace, preferred and last namespace does not exists`, async () => {
    checkNamespaceExistsMock
      .mockReturnValueOnce(Promise.resolve(false))
      .mockReturnValueOnce(Promise.resolve(false))
      .mockReturnValueOnce(Promise.resolve(false));

    const namespace = await getValueForNamespace(
      preferredNamespace,
      lastNamespace,
      true,
      activeNamespace,
    );

    expect(namespace).toEqual(ALL_NAMESPACES_KEY);
  });
});
