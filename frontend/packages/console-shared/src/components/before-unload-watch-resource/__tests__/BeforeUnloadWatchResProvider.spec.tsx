import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import BeforeUnloadWatchResContext, {
  BeforeUnloadWatchResContextType,
} from '../BeforeUnloadWatchResContext';
import BeforeUnloadWatchResProvider from '../BeforeUnloadWatchResProvider';
import { usePreventUnloadForResource } from '../usePreventUnloadForResource';

const usePreventUnloadForResourceMock = usePreventUnloadForResource as jest.Mock;
jest.mock('../usePreventUnloadForResource', () => ({ usePreventUnloadForResource: jest.fn() }));

describe('BeforeUnloadWatchResProvider', () => {
  let beforeUnloadWatchResContext: BeforeUnloadWatchResContextType;
  let wrapper: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const dummyWatchResFunc = jest.fn();

  beforeEach(() => {
    const TestComponent = () => {
      beforeUnloadWatchResContext = React.useContext(BeforeUnloadWatchResContext);
      return null;
    };
    usePreventUnloadForResourceMock.mockReturnValue(dummyWatchResFunc);
    wrapper = mount(
      <BeforeUnloadWatchResProvider>
        <TestComponent />
      </BeforeUnloadWatchResProvider>,
    );
  });

  it('should provide a context and render empty', () => {
    expect(typeof beforeUnloadWatchResContext.watchResource).toBe('function');
    expect(wrapper.isEmptyRender()).toEqual(true);
  });
});
