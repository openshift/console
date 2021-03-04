import { act } from 'react-dom/test-utils';
import useBeforeUnloadWatchResource from '../useBeforeUnloadWatchResource';
import BeforeUnloadWatchResProvider from '../BeforeUnloadWatchResProvider';
import { usePreventUnloadForResource } from '../usePreventUnloadForResource';
import { testHook } from '../../../../../../__tests__/utils/hooks-utils';

const usePreventUnloadForResourceMock = usePreventUnloadForResource as jest.Mock;
jest.mock('../usePreventUnloadForResource', () => ({ usePreventUnloadForResource: jest.fn() }));

describe('useBeforeUnloadWatchResource', () => {
  let beforeUnloadWatchResourceContext;
  const dummyWatchResFunc = jest.fn();

  beforeEach(() => {
    usePreventUnloadForResourceMock.mockReturnValue(dummyWatchResFunc);
    testHook(
      () => {
        beforeUnloadWatchResourceContext = useBeforeUnloadWatchResource();
      },
      { wrappingComponent: BeforeUnloadWatchResProvider },
    );
  });

  it('should provide a context', () => {
    expect(beforeUnloadWatchResourceContext).toBeDefined();
    expect(typeof beforeUnloadWatchResourceContext.watchResource).toBe('function');
  });

  it('should call watchResource with proper argument', () => {
    const cbfunc = () => true;
    act(() => {
      beforeUnloadWatchResourceContext.watchResource(
        {
          kind: 'Build',
          name: 'my-build-1',
          namespace: 'my-app',
        },
        cbfunc,
      );
    });
    expect(typeof beforeUnloadWatchResourceContext.watchResource).toBe('function');
    expect(dummyWatchResFunc).toHaveBeenCalledTimes(1);
    expect(dummyWatchResFunc).toHaveBeenCalledWith(
      { kind: 'Build', name: 'my-build-1', namespace: 'my-app' },
      cbfunc,
    );
  });
});
